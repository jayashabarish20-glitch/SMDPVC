import { AboutSectionManager } from './AboutSectionManager';

export function NurseryAboutManager() {
  return (
    <AboutSectionManager
      sectionKey="nursery"
      badge="NURSERY PAGE"
      title="Nursery – About"
      description="Upload and manage the photograph and description for the About section of the Nursery page (persisted in SQLite & Cloudinary)."
    />
  );
}
