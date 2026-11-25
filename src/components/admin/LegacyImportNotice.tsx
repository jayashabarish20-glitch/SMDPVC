import { useEffect, useState } from "react";
import {
  importLegacySlots,
  previewLegacyImport,
  type LegacySlot,
} from "../../services/legacyPhotoImport";

interface LegacyImportNoticeProps {
  configKeys: string[];
  onImported: () => void;
}

/**
 * Shows photos that exist only in this browser and have not been imported.
 * Renders nothing when there is nothing to import.
 */
export function LegacyImportNotice({ configKeys, onImported }: LegacyImportNoticeProps) {
  const [slots, setSlots] = useState<LegacySlot[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    previewLegacyImport(configKeys)
      .then(setSlots)
      .catch(() => setSlots([]));
    // configKeys are constant per manager
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = slots.reduce((sum, slot) => sum + slot.photos.length, 0);
  if (total === 0 && !message) return null;

  const handleImport = async () => {
    setIsBusy(true);
    setMessage(null);
    try {
      const count = await importLegacySlots(slots);
      setSlots([]);
      setMessage(`Imported ${count} photo(s).`);
      onImported();
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? `Import stopped: ${cause.message}. Run the import again to continue.`
          : "Import stopped. Run the import again to continue.",
      );
      setSlots(await previewLegacyImport(configKeys).catch(() => []));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-amber-800">
        {total > 0
          ? `${total} photo(s) were saved in this browser only. Import them once so they appear for all visitors. Your browser copy is kept.`
          : message}
      </p>
      {total > 0 && (
        <button
          type="button"
          onClick={handleImport}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-lg bg-school-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-school-navy-light disabled:opacity-50"
        >
          {isBusy ? "Importing…" : "Import photos from this browser"}
        </button>
      )}
      {total > 0 && message && <p className="w-full text-sm text-red-700">{message}</p>}
    </div>
  );
}
