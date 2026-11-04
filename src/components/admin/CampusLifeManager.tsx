import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { SinglePhotoManager } from './SinglePhotoManager';
import { PhotoGridManager } from './PhotoGridManager';

export function CampusLifeManager() {
  const { config, updateCampusImages, addPhoto, removePhoto } =
    usePhotoConfig();

  return (
    <div>
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Campus Life"
        description="Manage photos for the 'Vibrant Campus Life' section on the Higher Secondary page, including sports achievements and alumni spotlight."
      />

      <div className="space-y-8">
        {/* Sports Photo */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <SinglePhotoManager
            title="Sports & Achievements Photo"
            description="Main image displayed in the campus life section"
            currentPhoto={config.campusImages.sports}
            onUpdate={(photo) => {
              updateCampusImages({ sports: photo });
            }}
            onRemove={() => {
              updateCampusImages({ sports: null });
            }}
          />
        </div>

        {/* Alumni Gallery */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <h3 className="mb-2 font-serif text-xl font-bold text-school-navy">
            Alumni Spotlight Gallery
          </h3>
          <p className="mb-6 text-sm text-school-muted">
            Add alumnus/alumna profiles with photos, batch year, role, and testimonial
          </p>
          <PhotoGridManager
            title="Alumni Photos"
            photos={config.campusImages.alumni}
            onAddPhoto={(photo) => addPhoto('campusImages.alumni', photo)}
            onRemovePhoto={(id) => removePhoto('campusImages.alumni', id)}
            onReorderPhotos={(photos) => updateCampusImages({ alumni: photos })}
            emptyMessage="No alumni photos added yet. Add profiles to showcase distinguished graduates."
          />
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Future enhancement:</strong> Individual add/edit forms with fields for name,
              batch year, role, and testimonial quote will be added here.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-school-gold/20 bg-school-gold/5 p-6">
        <p className="text-sm font-medium text-school-navy">
          💡 <strong>Features not yet implemented:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-school-muted">
          <li>• Photo upload and validation</li>
          <li>• Alumni profile form (name, batch, role, quote)</li>
          <li>• Circular crop (1:1 aspect ratio)</li>
          <li>• Drag-to-reorder alumni</li>
          <li>• Live preview on Higher Secondary page</li>
          <li>• Save to persistent storage</li>
        </ul>
      </div>
    </div>
  );
}
