import { AboutSectionManager } from './AboutSectionManager';

export function HigherSecondaryAboutManager() {
  return (
    <AboutSectionManager
      sectionKey="higher-secondary"
      badge="HIGHER SECONDARY PAGE"
      title="Higher Secondary – About"
      description="Upload and manage the photograph and description for the About section of the Higher Secondary page (persisted in SQLite & Cloudinary)."
    />
  );
}
