/**
 * Replace / clear the photo of a single-photo slot (e.g. principal.higherSecondary)
 * using only existing backend endpoints. Kept free of browser/auth imports so the
 * orchestration can be unit-tested with injected API functions.
 *
 * Backend contract (photo_configurations): (config_key, display_order) is unique,
 * so a second photo can never be assigned to an occupied slot. Replacement is:
 *   1. read the current configurations fresh from the server (never trust cached ids)
 *   2. upload the new media
 *   3. assign it to a FREE display_order (old photo stays linked and visible)
 *   4. unlink the old configuration(s)
 *   5. move the new configuration to display_order 0
 *   6. best-effort delete of the old media (backend refuses if it is still in use)
 * Any failure before step 4 completes rolls back the new upload; the old photo
 * remains connected.
 */

export interface SlotConfig {
  configId: string;
  mediaId: string;
  displayOrder: number;
}

export interface SingleSlotApi {
  listConfigs(configKey: string): Promise<SlotConfig[]>;
  uploadMedia(file: File, altText: string): Promise<{ id: string }>;
  assign(mediaId: string, configKey: string, displayOrder: number): Promise<{ id: string }>;
  unlink(configId: string): Promise<void>;
  reorder(configId: string, displayOrder: number): Promise<void>;
  deleteMedia(mediaId: string): Promise<void>;
}

export interface SlotResult {
  /** Non-fatal issues (e.g. old media could not be deleted). The slot itself is correct. */
  warnings: string[];
}

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function replaceSingleSlotPhoto(
  api: SingleSlotApi,
  file: File,
  configKey: string,
  altText = "",
): Promise<SlotResult> {
  const warnings: string[] = [];
  const existing = await api.listConfigs(configKey);

  const media = await api.uploadMedia(file, altText);

  const freeOrder = existing.reduce((max, c) => Math.max(max, c.displayOrder + 1), 0);
  let newConfigId: string;
  try {
    newConfigId = (await api.assign(media.id, configKey, freeOrder)).id;
  } catch (assignError) {
    // New upload is not linked anywhere: remove it so no orphan remains.
    try {
      await api.deleteMedia(media.id);
    } catch (cleanupError) {
      warnings.push(`Unlinked upload could not be removed: ${messageOf(cleanupError)}`);
    }
    throw assignError;
  }

  // Unlink the previous configuration(s). A 404 means it is already gone.
  const unlinked: SlotConfig[] = [];
  for (const old of existing) {
    try {
      await api.unlink(old.configId);
      unlinked.push(old);
    } catch (unlinkError) {
      if (statusOf(unlinkError) === 404) {
        continue;
      }
      // Roll back: restore anything already unlinked, drop the new link + upload.
      for (const restored of unlinked) {
        try {
          await api.assign(restored.mediaId, configKey, restored.displayOrder);
        } catch {
          // Restore failed; surfaced via the thrown error below.
        }
      }
      try {
        await api.unlink(newConfigId);
        await api.deleteMedia(media.id);
      } catch {
        // New photo may remain linked at a free slot; reported below.
      }
      throw new Error(
        `Could not replace the existing photo; the previous photo was kept. ${messageOf(unlinkError)}`,
      );
    }
  }

  if (freeOrder !== 0) {
    try {
      await api.reorder(newConfigId, 0);
    } catch (reorderError) {
      // The new photo is the only one linked, so it is still shown; report it.
      warnings.push(`New photo saved but could not be moved to position 0: ${messageOf(reorderError)}`);
    }
  }

  // Old media is deleted only after the new photo is fully linked.
  // The backend refuses (409) if the media is referenced elsewhere, so shared media is safe.
  for (const old of unlinked) {
    if (old.mediaId === media.id) continue;
    try {
      await api.deleteMedia(old.mediaId);
    } catch (deleteError) {
      warnings.push(`Previous image was unlinked but not deleted: ${messageOf(deleteError)}`);
    }
  }

  return { warnings };
}

export async function clearSingleSlotPhoto(
  api: SingleSlotApi,
  configKey: string,
): Promise<SlotResult> {
  const warnings: string[] = [];
  const existing = await api.listConfigs(configKey);
  for (const old of existing) {
    try {
      await api.unlink(old.configId);
    } catch (unlinkError) {
      if (statusOf(unlinkError) === 404) continue;
      throw unlinkError;
    }
    try {
      await api.deleteMedia(old.mediaId);
    } catch (deleteError) {
      warnings.push(`Photo was unlinked but its image was not deleted: ${messageOf(deleteError)}`);
    }
  }
  return { warnings };
}
