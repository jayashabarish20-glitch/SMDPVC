import { useSingleSlot } from '../../hooks/useSingleSlot';
import { SectionHeader } from './SectionHeader';
import { SinglePhotoManager } from './SinglePhotoManager';
import { LegacyImportNotice } from './LegacyImportNotice';

const SPORTS_KEY = 'campusImages.sports';
const PRINCIPAL_KEY = 'campusImages.principal';

export function Hero3DCardsManager() {
  const sports = useSingleSlot(SPORTS_KEY);
  const principal = useSingleSlot(PRINCIPAL_KEY);

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Hero 3D Cards"
        description="Manage images displayed in the 3D floating card effect on the home page hero section."
      />

      <LegacyImportNotice
        configKeys={[SPORTS_KEY, PRINCIPAL_KEY]}
        onImported={() => {
          void sports.reload();
          void principal.reload();
        }}
      />

      <div className="space-y-6">
        {/* Sports Card */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <SinglePhotoManager
            title="Sports & Campus Activities"
            description="Bottom-left floating card showing campus activities"
            currentPhoto={sports.current}
            onUpdate={(photo) => {
              void sports.update(photo);
            }}
            onRemove={() => {
              void sports.remove();
            }}
          />
        </div>

        {/* Principal Card */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <SinglePhotoManager
            title="Leadership & Community"
            description="Top-right floating card showing school leadership"
            currentPhoto={principal.current}
            onUpdate={(photo) => {
              void principal.update(photo);
            }}
            onRemove={() => {
              void principal.remove();
            }}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-school-gold/20 bg-school-gold/5 p-6">
        <p className="text-sm font-medium text-school-navy">
          💡 <strong>Features not yet implemented:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-school-muted">
          <li>• Photo upload and validation</li>
          <li>• Image optimization for 3D cards</li>
          <li>• Live 3D preview</li>
          <li>• Save to persistent storage</li>
        </ul>
      </div>
    </div>
  );
}
