import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import { createServer as createViteServer, loadEnv } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const production = process.argv.includes("--production") || process.env.NODE_ENV === "production";
const env = loadEnv(production ? "production" : "development", root, "");
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

const maxFileSize = 20 * 1024 * 1024;
const storageDirectory = path.resolve(
  process.env.NURSERY_CALENDAR_STORAGE_DIR ||
    path.join(root, ".data", "nursery-academic-calendar")
);
const metadataPath = path.join(storageDirectory, "current.json");
const credentialsPath = path.join(storageDirectory, "admin-credentials.json");
const sessions = new Map();
const loginAttempts = new Map();
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter(_request, file, callback) {
    if (
      file.mimetype !== "application/pdf" &&
      !file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      callback(new Error("Select a PDF file to upload."));
      return;
    }
    callback(null, true);
  },
});

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

function sendError(response, status, message) {
  response.status(status).json({ error: message });
}

function toCalendarView(calendar) {
  return {
    fileName: calendar.fileName,
    uploadedAt: calendar.uploadedAt,
    published: calendar.published,
  };
}

async function readCalendar() {
  try {
    const contents = await fs.readFile(metadataPath, "utf8");
    const calendar = JSON.parse(contents);
    if (
      typeof calendar.fileName !== "string" ||
      typeof calendar.storageFile !== "string" ||
      typeof calendar.uploadedAt !== "string" ||
      typeof calendar.published !== "boolean"
    ) {
      throw new Error("The stored Nursery calendar metadata is invalid.");
    }
    return calendar;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeCalendar(calendar) {
  const temporaryPath = `${metadataPath}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(calendar), {
      encoding: "utf8",
      flag: "wx",
    });
    await fs.rename(temporaryPath, metadataPath);
  } catch (error) {
    try {
      await fs.rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      console.error("Could not remove temporary calendar metadata:", cleanupError);
      throw new Error(
        `Could not save calendar metadata (${
          error instanceof Error ? error.message : "unknown error"
        }); temporary metadata cleanup also failed (${
          cleanupError instanceof Error ? cleanupError.message : "unknown error"
        }).`
      );
    }
    throw error;
  }
}

function calendarFilePath(calendar) {
  if (!/^[0-9a-f-]+\.pdf$/i.test(calendar.storageFile)) {
    throw new Error("The stored Nursery calendar file reference is invalid.");
  }
  return path.join(storageDirectory, calendar.storageFile);
}

function getSessionToken(request) {
  return request.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("nursery_calendar_session="))
    ?.slice("nursery_calendar_session=".length);
}

function adminSession(request, response, next) {
  const token = getSessionToken(request);
  const expiresAt = token ? sessions.get(token) : undefined;
  if (!expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    sendError(response, 401, "Staff sign-in is required to manage this calendar.");
    return;
  }
  next();
}

function sameOriginMutation(request, response, next) {
  const origin = request.get("origin");
  try {
    if (!origin || new URL(origin).host !== request.get("host")) {
      sendError(response, 403, "This calendar request is not allowed.");
      return;
    }
  } catch {
    sendError(response, 403, "This calendar request is not allowed.");
    return;
  }
  next();
}

function safeFileName(name) {
  const baseName = path
    .basename(name)
    .replace(/\.pdf$/i, "")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 120);
  return `${baseName || "Nursery_Academic_Calendar"}.pdf`;
}

function calendarUploadError(error, _request, response, next) {
  if (error instanceof multer.MulterError) {
    sendError(
      response,
      error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      error.code === "LIMIT_FILE_SIZE"
        ? "The PDF must be 20 MB or smaller."
        : "Upload one PDF file at a time."
    );
    return;
  }
  if (error instanceof Error && error.message === "Select a PDF file to upload.") {
    sendError(response, 400, error.message);
    return;
  }
  next(error);
}

const adminEmail = (process.env.NURSERY_CALENDAR_ADMIN_EMAIL || "admin@smdpvc.local")
  .trim()
  .toLowerCase();
let adminPasswordHash;

async function initializeAdminPassword() {
  await fs.mkdir(storageDirectory, { recursive: true });
  if (process.env.NURSERY_CALENDAR_ADMIN_PASSWORD) {
    adminPasswordHash = crypto
      .createHash("sha256")
      .update(process.env.NURSERY_CALENDAR_ADMIN_PASSWORD)
      .digest();
    return;
  }
  if (production) {
    throw new Error(
      "Set NURSERY_CALENDAR_ADMIN_PASSWORD in the production environment."
    );
  }

  try {
    const stored = JSON.parse(await fs.readFile(credentialsPath, "utf8"));
    if (typeof stored.passwordHash === "string") {
      adminPasswordHash = Buffer.from(stored.passwordHash, "hex");
      if (adminPasswordHash.length === 32) return;
    }
    throw new Error("The saved Nursery calendar admin credential is invalid.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const password = crypto.randomBytes(24).toString("base64url");
  adminPasswordHash = crypto.createHash("sha256").update(password).digest();
  const temporaryPath = `${credentialsPath}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(
    temporaryPath,
    JSON.stringify({ passwordHash: adminPasswordHash.toString("hex") }),
    { encoding: "utf8", mode: 0o600, flag: "wx" }
  );
  await fs.rename(temporaryPath, credentialsPath);
  console.info(
    `Nursery calendar admin login: ${adminEmail}\nGenerated password (save it now): ${password}`
  );
}

function isAdminEmail(value) {
  const submitted = Buffer.from(String(value || "").trim().toLowerCase());
  const expected = Buffer.from(adminEmail);
  return (
    submitted.length === expected.length &&
    crypto.timingSafeEqual(submitted, expected)
  );
}

function isAdminPassword(value) {
  const submitted = crypto
    .createHash("sha256")
    .update(String(value || ""))
    .digest();
  return crypto.timingSafeEqual(submitted, adminPasswordHash);
}

function getLoginAttempt(ip) {
  const now = Date.now();
  const recent = (loginAttempts.get(ip) || []).filter(
    (timestamp) => now - timestamp < 15 * 60 * 1000
  );
  loginAttempts.set(ip, recent);
  return recent;
}

app.get("/api/nursery-academic-calendar", async (_request, response, next) => {
  try {
    const calendar = await readCalendar();
    if (!calendar?.published) {
      response.set("Cache-Control", "no-store").json(null);
      return;
    }
    response.set("Cache-Control", "no-store").json(toCalendarView(calendar));
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/nursery-academic-calendar/download",
  async (_request, response, next) => {
    try {
      const calendar = await readCalendar();
      if (!calendar?.published) {
        sendError(response, 404, "No Nursery Academic Calendar is published.");
        return;
      }
      response.set({
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.download(
        calendarFilePath(calendar),
        "SMDPVC_Nursery_Academic_Calendar.pdf",
        { dotfiles: "allow" },
        (error) => {
          if (error && !response.headersSent) next(error);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/admin/session", sameOriginMutation, (request, response) => {
  const attempts = getLoginAttempt(request.ip || request.socket.remoteAddress || "");
  if (attempts.length >= 10) {
    sendError(response, 429, "Too many sign-in attempts. Try again in 15 minutes.");
    return;
  }
  if (!isAdminEmail(request.body?.email) || !isAdminPassword(request.body?.password)) {
    attempts.push(Date.now());
    loginAttempts.set(request.ip || request.socket.remoteAddress || "", attempts);
    sendError(response, 401, "The email or password is incorrect.");
    return;
  }

  const token = crypto.randomBytes(32).toString("base64url");
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
  response.cookie("nursery_calendar_session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: production,
    maxAge: 8 * 60 * 60 * 1000,
    path: "/api/admin",
  });
  response.json({ email: adminEmail });
});

app.get("/api/admin/session", (request, response) => {
  const token = getSessionToken(request);
  const expiresAt = token ? sessions.get(token) : undefined;
  if (!expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    response.set("Cache-Control", "no-store").json(null);
    return;
  }
  response.set("Cache-Control", "no-store").json({ email: adminEmail });
});

app.delete(
  "/api/admin/session",
  sameOriginMutation,
  adminSession,
  (request, response) => {
    const token = getSessionToken(request);
    if (token) sessions.delete(token);
    response.clearCookie("nursery_calendar_session", {
      httpOnly: true,
      sameSite: "strict",
      secure: production,
      path: "/api/admin",
    });
    response.status(204).end();
  }
);

app.get(
  "/api/admin/nursery-academic-calendar",
  adminSession,
  async (_request, response, next) => {
    try {
      const calendar = await readCalendar();
      if (!calendar) {
        response.set("Cache-Control", "no-store").json(null);
        return;
      }
      response.set("Cache-Control", "no-store").json(toCalendarView(calendar));
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/admin/nursery-academic-calendar",
  sameOriginMutation,
  adminSession,
  upload.single("file"),
  async (request, response, next) => {
    let newFilePath;
    try {
      const file = request.file;
      if (!file) {
        sendError(response, 400, "Choose a PDF file to upload.");
        return;
      }
      if (
        file.size === 0 ||
        file.mimetype !== "application/pdf" &&
          !file.originalname.toLowerCase().endsWith(".pdf") ||
        file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-" ||
        !file.buffer
          .subarray(Math.max(0, file.size - 1024))
          .toString("latin1")
          .includes("%%EOF")
      ) {
        sendError(response, 400, "The selected file is not a valid PDF.");
        return;
      }

      const previous = await readCalendar();
      const storageFile = `${crypto.randomUUID()}.pdf`;
      newFilePath = path.join(storageDirectory, storageFile);
      await fs.writeFile(newFilePath, file.buffer, { flag: "wx", mode: 0o600 });
      const calendar = {
        fileName: safeFileName(file.originalname),
        storageFile,
        uploadedAt: new Date().toISOString(),
        published: true,
        size: file.size,
      };

      try {
        await writeCalendar(calendar);
      } catch (error) {
        try {
          await fs.rm(newFilePath, { force: true });
        } catch (cleanupError) {
          console.error("Could not remove an incomplete Nursery calendar upload:", cleanupError);
          throw new Error(
            `Could not save the calendar metadata (${
              error instanceof Error ? error.message : "unknown error"
            }); incomplete upload cleanup also failed (${
              cleanupError instanceof Error ? cleanupError.message : "unknown error"
            }).`
          );
        }
        throw error;
      }
      newFilePath = undefined;

      let cleanupWarning;
      if (previous) {
        try {
          await fs.rm(calendarFilePath(previous));
        } catch (error) {
          cleanupWarning =
            "The new calendar is published, but the previous PDF could not be removed.";
          console.error("Could not remove the replaced Nursery calendar:", error);
        }
      }
      response.status(201).json({
        calendar: toCalendarView(calendar),
        ...(cleanupWarning ? { cleanupWarning } : {}),
      });
    } catch (error) {
      if (newFilePath) {
        try {
          await fs.rm(newFilePath, { force: true });
        } catch (cleanupError) {
          console.error("Could not remove an incomplete Nursery calendar upload:", cleanupError);
          next(
            new Error(
              `The upload failed (${
                error instanceof Error ? error.message : "unknown error"
              }); incomplete upload cleanup also failed (${
                cleanupError instanceof Error ? cleanupError.message : "unknown error"
              }).`
            )
          );
          return;
        }
      }
      next(error);
    }
  },
  calendarUploadError
);

app.put(
  "/api/admin/nursery-academic-calendar",
  sameOriginMutation,
  adminSession,
  async (request, response, next) => {
    try {
      if (typeof request.body?.published !== "boolean") {
        sendError(response, 400, "Choose whether to publish the calendar.");
        return;
      }
      const calendar = await readCalendar();
      if (!calendar) {
        sendError(response, 404, "No Nursery Academic Calendar is uploaded.");
        return;
      }
      calendar.published = request.body.published;
      await writeCalendar(calendar);
      response.set("Cache-Control", "no-store").json(toCalendarView(calendar));
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/admin/nursery-academic-calendar/preview",
  adminSession,
  async (_request, response, next) => {
    try {
      const calendar = await readCalendar();
      if (!calendar) {
        sendError(response, 404, "No Nursery Academic Calendar is uploaded.");
        return;
      }
      response.set({
        "Cache-Control": "no-store",
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${calendar.fileName}"`,
        "X-Content-Type-Options": "nosniff",
      });
      response.sendFile(
        calendarFilePath(calendar),
        { dotfiles: "allow" },
        (error) => {
          if (error && !response.headersSent) next(error);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/admin/nursery-academic-calendar",
  sameOriginMutation,
  adminSession,
  async (_request, response, next) => {
    try {
      const calendar = await readCalendar();
      if (!calendar) {
        sendError(response, 404, "No Nursery Academic Calendar is uploaded.");
        return;
      }
      await fs.rm(metadataPath);
      try {
        await fs.rm(calendarFilePath(calendar));
      } catch (error) {
        console.error("Could not remove the deleted Nursery calendar PDF:", error);
        sendError(
          response,
          500,
          "The calendar was unpublished, but the stored PDF could not be removed."
        );
        return;
      }
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

app.use("/api", (_request, response) => {
  sendError(response, 404, "Nursery calendar endpoint not found.");
});

if (production) {
  const distDirectory = path.join(root, "dist");
  app.use(express.static(distDirectory));
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) {
      next();
      return;
    }
    response.sendFile(path.join(distDirectory, "index.html"), (error) => {
      if (error) next(error);
    });
  });
} else {
  const vite = await createViteServer({
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.use((error, _request, response, _next) => {
  console.error("Nursery calendar server error:", error);
  if (response.headersSent) return;
  sendError(response, 500, "The Nursery Academic Calendar request failed.");
});

await initializeAdminPassword();
const port = Number(process.env.PORT || 5173);
app.listen(port, "0.0.0.0", () => {
  console.info(
    `SMDPVC ${production ? "production" : "development"} server listening on port ${port}.`
  );
});
