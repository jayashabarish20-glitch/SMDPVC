import { AchieversManager } from './AchieversManager';
import { SectionHeader } from './SectionHeader';

export function ExcellenceManager() {
  return (
    <div>
      <SectionHeader
        badge="ACADEMIC EXCELLENCE"
        title="Excellence & Toppers Management"
        description="Manage Class 10 (SSLC) and Class 12 (Higher Secondary) student toppers, scores, ranks, and photographs. All data and images are persisted in SQLite and Cloudinary."
      />
      <div className="mt-6">
        <AchieversManager />
      </div>
    </div>
  );
}
