import { AboutSectionManager } from './AboutSectionManager';

export function PrimaryAboutManager() {
  return (
    <AboutSectionManager
      sectionKey="primary"
      badge="PRIMARY PAGE"
      title="Primary – About"
      description="Upload and manage the photograph and description for the About section of the Primary page (persisted in SQLite & Cloudinary)."
    />
  );
}
