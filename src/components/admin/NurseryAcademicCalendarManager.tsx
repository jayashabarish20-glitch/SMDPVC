import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  deleteNurseryCalendar,
  getAdminNurseryCalendar,
  getNurseryCalendarAdminSession,
  previewNurseryCalendarBlob,
  signInNurseryCalendarAdmin,
  signOutNurseryCalendarAdmin,
  setNurseryCalendarPublished,
  uploadNurseryCalendar,
  type NurseryCalendar,
} from "../../data/nurseryCalendarService";
import { Icon } from "../Icon";
import { SectionHeader } from "./SectionHeader";

function formatUploadDate(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "Date unavailable";
}

export function NurseryAcademicCalendarManager() {
  const [user, setUser] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [calendar, setCalendar] = useState<NurseryCalendar | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  useEffect(() => {
    let active = true;
    void getNurseryCalendarAdminSession()
      .then((session) => {
        if (!active) return;
        setUser(session?.email ?? null);
        setIsAuthorized(session !== null);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not verify the staff session."
          );
        }
      })
      .finally(() => {
        if (active) setIsCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    let active = true;
    void getAdminNurseryCalendar()
      .then((currentCalendar) => {
        if (active) setCalendar(currentCalendar);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load the calendar."
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthorized]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    try {
      const session = await signInNurseryCalendarAdmin(email.trim(), password);
      setUser(session.email);
      setIsAuthorized(true);
      setPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not sign in."
      );
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAuthorized) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgress(0);
    try {
      const result = await uploadNurseryCalendar(file, setProgress);
      setCalendar(result.calendar);
      setSuccessMessage(
        result.cleanupWarning ??
          "Nursery Academic Calendar uploaded and published."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The PDF upload failed."
      );
    } finally {
      setProgress(null);
      event.target.value = "";
    }
  };

  const handlePublication = async (published: boolean) => {
    if (!calendar) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setCalendar(await setNurseryCalendarPublished(published));
      setSuccessMessage(
        published
          ? "Nursery Academic Calendar published."
          : "Nursery Academic Calendar unpublished."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update the publication status."
      );
    }
  };

  const handleDelete = async () => {
    if (!calendar) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteNurseryCalendar();
      setCalendar(null);
      setPreviewUrl(null);
      setSuccessMessage("Nursery Academic Calendar deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not delete the PDF."
      );
    }
  };

  const handlePreview = async () => {
    if (!calendar) return;
    setErrorMessage(null);
    try {
      const blob = await previewNurseryCalendarBlob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not open the PDF."
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutNurseryCalendarAdmin();
      setUser(null);
      setIsAuthorized(false);
      setCalendar(null);
      setPreviewUrl(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not sign out."
      );
    }
  };

  return (
    <div>
      <SectionHeader
        badge="NURSERY PAGE"
        title="Nursery Academic Calendar"
        description="Upload and publish the PDF displayed in the Nursery section of the public website."
      />

      <div className="space-y-6 rounded-2xl border border-school-navy/10 bg-white p-5 sm:p-8">
        {errorMessage && (
          <p
            role="alert"
            className="break-words rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {successMessage}
          </p>
        )}

        {isCheckingAuth ? (
          <p className="text-sm text-school-muted">Checking permissions…</p>
        ) : !user ? (
          <form onSubmit={handleSignIn} className="max-w-lg space-y-4">
            <h3 className="font-serif text-xl font-bold text-school-navy">
              Authorized staff sign in
            </h3>
            <label className="block text-sm font-semibold text-school-navy">
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-lg border border-school-navy/15 px-3 py-2 text-base"
              />
            </label>
            <label className="block text-sm font-semibold text-school-navy">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-lg border border-school-navy/15 px-3 py-2 text-base"
              />
            </label>
            <button
              type="submit"
              className="min-h-12 rounded-lg bg-school-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-school-navy-light disabled:opacity-50"
            >
              Sign in
            </button>
          </form>
        ) : !isAuthorized ? (
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              This account is not authorized to manage calendars. Admin or
              faculty permissions are required.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-11 rounded-lg border border-school-navy/20 px-4 py-2 text-sm font-semibold"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-school-muted">
                Signed in as <span className="font-semibold">{user}</span>
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-11 rounded-lg border border-school-navy/20 px-4 py-2 text-sm font-semibold text-school-navy hover:bg-school-cream"
              >
                Sign out
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-school-navy/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-school-navy">
                  Calendar PDF
                </h3>
                <p className="mt-1 text-sm text-school-muted">
                  PDF only · Maximum 20 MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-school-gold px-4 py-3 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50 sm:w-auto"
              >
                <Icon name="upload" className="h-4 w-4" />
                {busy
                  ? `Uploading ${progress ?? 0}%`
                  : calendar
                    ? "Replace PDF"
                    : "Upload PDF"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleUpload}
                disabled={busy}
                className="hidden"
                aria-label="Upload Nursery Academic Calendar PDF"
              />
            </div>

            {busy && (
              <div
                className="h-2 overflow-hidden rounded-full bg-school-cream-alt"
                role="progressbar"
                aria-label="PDF upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress ?? 0}
              >
                <div
                  className="h-full rounded-full bg-school-gold transition-[width]"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            )}

            {calendar ? (
              <div className="space-y-4 rounded-xl border border-school-navy/10 bg-school-cream/60 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-school-navy">
                      {calendar.fileName}
                    </p>
                    <p className="mt-1 text-xs text-school-muted">
                      Uploaded {formatUploadDate(calendar.uploadedAt)}
                    </p>
                    <p
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        calendar.published
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {calendar.published ? "Published" : "Unpublished"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="min-h-11 shrink-0 rounded-lg border border-school-navy/20 px-4 py-2 text-sm font-semibold text-school-navy hover:bg-white"
                  >
                    Preview PDF
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => void handlePublication(!calendar.published)}
                    className="min-h-12 rounded-lg bg-school-navy px-4 py-3 text-sm font-semibold text-white hover:bg-school-navy-light"
                  >
                    {calendar.published ? "Unpublish" : "Publish calendar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="min-h-12 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete calendar
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-school-navy/20 px-4 py-8 text-center text-sm text-school-muted">
                No Nursery calendar PDF has been uploaded.
              </p>
            )}

            <AnimatePresence>
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 rounded-xl border border-school-navy/10 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-school-navy">
                      PDF preview
                    </h4>
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(null)}
                      className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-school-navy underline"
                    >
                      Close preview
                    </button>
                  </div>
                  <iframe
                    title="Nursery Academic Calendar PDF preview"
                    src={previewUrl}
                    className="h-[min(70vh,48rem)] w-full rounded-lg border border-school-navy/10"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs leading-relaxed text-school-muted">
              Uploading or replacing a PDF publishes the latest Nursery
              calendar automatically. Only this Nursery calendar is shown on
              the public Nursery page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
