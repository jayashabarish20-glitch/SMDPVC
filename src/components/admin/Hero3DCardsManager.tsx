import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { SinglePhotoManager } from './SinglePhotoManager';

export function Hero3DCardsManager() {
  const { config, updateCampusImages } = usePhotoConfig();

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Hero 3D Cards"
        description="Manage images displayed in the 3D floating card effect on the home page hero section."
      />

      <div className="space-y-6">
        {/* Sports Card */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <SinglePhotoManager
            title="Sports & Campus Activities"
            description="Bottom-left floating card showing campus activities"
            currentPhoto={config.campusImages.sports}
            onUpdate={(photo) => {
              updateCampusImages({ sports: photo });
            }}
            onRemove={() => {
              updateCampusImages({ sports: null });
            }}
          />
        </div>

        {/* Principal Card */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <SinglePhotoManager
            title="Leadership & Community"
            description="Top-right floating card showing school leadership"
            currentPhoto={config.campusImages.principal}
            onUpdate={(photo) => {
              updateCampusImages({ principal: photo });
            }}
            onRemove={() => {
              updateCampusImages({ principal: null });
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
