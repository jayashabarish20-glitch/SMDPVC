import { AlumniManager } from './AlumniManager';
import { SectionHeader } from './SectionHeader';

export function CampusLifeManager() {
  return (
    <div>
      <SectionHeader
        badge="CAMPUS LIFE & ALUMNI"
        title="Distinguished Alumni Management"
        description="Manage alumni profiles, photographs, graduation batches, and descriptions. Stored in SQLite and served through Cloudinary."
      />
      <div className="mt-6">
        <AlumniManager />
      </div>
    </div>
  );
}
