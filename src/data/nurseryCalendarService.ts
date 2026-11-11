export const MAX_NURSERY_CALENDAR_SIZE = 20 * 1024 * 1024;
export const STUDENT_CALENDAR_FILENAME = "SMDPVC_Nursery_Academic_Calendar.pdf";

export interface NurseryCalendar {
  fileName: string;
  uploadedAt: Date | null;
  published: boolean;
}

export interface NurseryCalendarUploadResult {
  calendar: NurseryCalendar;
  cleanupWarning?: string;
}

interface SerializedNurseryCalendar {
  fileName: string;
  uploadedAt: string;
  published: boolean;
}

export interface NurseryCalendarAdmin {
  email: string;
}

interface ApiError {
  error?: string;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error || `Request failed (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function parseCalendar(data: {
  fileName: string;
  uploadedAt: string;
  published: boolean;
}): NurseryCalendar {
  return {
    fileName: data.fileName,
    uploadedAt: new Date(data.uploadedAt),
    published: data.published,
  };
}

export async function getPublicNurseryCalendar(): Promise<NurseryCalendar | null> {
  const response = await fetch("/api/nursery-academic-calendar", {
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error || "Could not load the Nursery calendar.");
  }
  const data = (await response.json()) as
    | SerializedNurseryCalendar
    | null;
  return data ? parseCalendar(data) : null;
}

export function watchPublicNurseryCalendar(
  onCalendar: (calendar: NurseryCalendar | null) => void,
  onError: (error: Error) => void
) {
  let active = true;
  const refresh = async () => {
    try {
      const calendar = await getPublicNurseryCalendar();
      if (active) onCalendar(calendar);
    } catch (error) {
      if (active) {
        onError(
          error instanceof Error
            ? error
            : new Error("Could not load the Nursery calendar.")
        );
      }
    }
  };

  void refresh();
  const interval = window.setInterval(() => void refresh(), 15_000);
  return () => {
    active = false;
    window.clearInterval(interval);
  };
}

export async function getNurseryCalendarAdminSession(): Promise<NurseryCalendarAdmin | null> {
  const response = await fetch("/api/admin/session", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not verify the staff session.");
  }
  return (await response.json()) as NurseryCalendarAdmin | null;
}

export function signInNurseryCalendarAdmin(
  email: string,
  password: string
): Promise<NurseryCalendarAdmin> {
  return requestJson("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signOutNurseryCalendarAdmin(): Promise<void> {
  await requestJson("/api/admin/session", { method: "DELETE" });
}

export async function getAdminNurseryCalendar(): Promise<NurseryCalendar | null> {
  const response = await fetch("/api/admin/nursery-academic-calendar", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error || "Could not load the Nursery calendar.");
  }
  const data = (await response.json()) as
    | SerializedNurseryCalendar
    | null;
  return data ? parseCalendar(data) : null;
}

export function uploadNurseryCalendar(
  file: File,
  onProgress: (progress: number) => void
): Promise<NurseryCalendarUploadResult> {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return Promise.reject(new Error("Select a PDF file to upload."));
  }
  if (file.size === 0 || file.size > MAX_NURSERY_CALENDAR_SIZE) {
    return Promise.reject(new Error("The PDF must be smaller than 20 MB."));
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/nursery-academic-calendar");
    request.withCredentials = true;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      let body: NurseryCalendarUploadResult & ApiError;
      try {
        body = JSON.parse(request.responseText || "{}") as
          NurseryCalendarUploadResult & ApiError;
      } catch {
        reject(new Error("The server returned an invalid upload response."));
        return;
      }
      if (request.status >= 200 && request.status < 300) {
        resolve({
          ...body,
          calendar: parseCalendar(
            body.calendar as unknown as SerializedNurseryCalendar
          ),
        });
      } else {
        reject(
          new Error(
            (body as ApiError).error ||
              `The PDF upload failed (${request.status}).`
          )
        );
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("The PDF upload failed due to a network error."))
    );
    const formData = new FormData();
    formData.append("file", file);
    request.send(formData);
  });
}

export async function setNurseryCalendarPublished(
  published: boolean
): Promise<NurseryCalendar> {
  const result = await requestJson<{
    fileName: string;
    uploadedAt: string;
    published: boolean;
  }>("/api/admin/nursery-academic-calendar", {
    method: "PUT",
    body: JSON.stringify({ published }),
  });
  return parseCalendar(result);
}

export async function deleteNurseryCalendar(): Promise<void> {
  await requestJson("/api/admin/nursery-academic-calendar", {
    method: "DELETE",
  });
}

async function getCalendarBlob(url: string): Promise<Blob> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error || `Could not retrieve the PDF (${response.status}).`);
  }
  const blob = await response.blob();
  const header = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(header) !== "%PDF-") {
    throw new Error("The stored file is not a valid PDF.");
  }
  return blob;
}

export function downloadNurseryCalendarBlob(): Promise<Blob> {
  return getCalendarBlob("/api/nursery-academic-calendar/download");
}

export function previewNurseryCalendarBlob(): Promise<Blob> {
  return getCalendarBlob("/api/admin/nursery-academic-calendar/preview");
}
