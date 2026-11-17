import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  downloadNurseryCalendarBlob,
  STUDENT_CALENDAR_FILENAME,
  watchPublicNurseryCalendar,
  type NurseryCalendar,
} from "../data/nurseryCalendarService";

type DownloadNotice =
  | { type: "success" | "error"; message: string }
  | null;

function CheckCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 shrink-0"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path
        d="m7.5 12.2 3 3 6-6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function NurseryAcademicCalendar() {
  const [calendar, setCalendar] = useState<NurseryCalendar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<DownloadNotice>(null);

  useEffect(() => {
    try {
      return watchPublicNurseryCalendar(
        (publishedCalendar) => {
          setCalendar(publishedCalendar);
          setLoadError(null);
          setIsLoading(false);
        },
        (error) => {
          setLoadError(error.message);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The Nursery Academic Calendar could not be loaded."
      );
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleDownload = async () => {
    if (!calendar || isDownloading) return;
    setIsDownloading(true);
    setNotice(null);

    try {
      const blob = await downloadNurseryCalendarBlob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = STUDENT_CALENDAR_FILENAME;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setNotice({
        type: "success",
        message: "Academic Calendar downloaded successfully!",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not download the Academic Calendar. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-5">
      {isLoading ? (
        <p className="text-sm text-school-muted" role="status">
          Loading the Nursery Academic Calendar…
        </p>
      ) : loadError ? (
        <p className="break-words rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The Nursery Academic Calendar is temporarily unavailable.
        </p>
      ) : calendar ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-school-navy/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-school-navy">
              Academic Calendar PDF
            </p>
            <p className="mt-1 break-all text-sm text-school-muted">
              {calendar.fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isDownloading}
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-school-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-school-navy-light disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            {isDownloading ? "Preparing download…" : "Download calendar"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-school-muted">
          The Nursery Academic Calendar has not been published yet.
        </p>
      )}

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            role={notice.type === "error" ? "alert" : "status"}
            aria-live={notice.type === "error" ? "assertive" : "polite"}
            className={`pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-[100] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
              notice.type === "success"
                ? "bg-emerald-700 text-white"
                : "bg-red-700 text-white"
            }`}
          >
            {notice.type === "success" && <CheckCircleIcon />}
            <span className="min-w-0 break-words">{notice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
