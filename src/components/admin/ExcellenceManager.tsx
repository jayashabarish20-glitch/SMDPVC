import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { PhotoGridManager } from './PhotoGridManager';

export function ExcellenceManager() {
  const { config, updateCampusImages, addPhoto, removePhoto } =
    usePhotoConfig();

  return (
    <div>
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Excellence & Achievements"
        description="Manage student topper photos for the 'Celebrating Excellence' section on the Higher Secondary page. Photos are displayed by class and achievement level."
      />

      <div className="space-y-8">
        {/* Class 12 Toppers */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <h3 className="mb-2 font-serif text-xl font-bold text-school-navy">
            Class 12 Toppers
          </h3>
          <p className="mb-6 text-sm text-school-muted">
            Add photos for the top 3 Class 12 board exam performers
          </p>
          <PhotoGridManager
            title="Class 12 Topper Photos"
            photos={config.campusImages.toppers12}
            onAddPhoto={(p) => addPhoto('campusImages.toppers12', p)}
            onRemovePhoto={(id) => removePhoto('campusImages.toppers12', id)}
            onReorderPhotos={(photos) =>
              updateCampusImages({ toppers12: photos })
            }
            emptyMessage="No Class 12 topper photos added yet."
            maxPhotos={3}
          />
        </div>

        {/* Class 10 Toppers */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <h3 className="mb-2 font-serif text-xl font-bold text-school-navy">
            Class 10 Toppers
          </h3>
          <p className="mb-6 text-sm text-school-muted">
            Add or replace Class 10 topper photos (currently using external Unsplash images)
          </p>
          <PhotoGridManager
            title="Class 10 Topper Photos"
            photos={[]} // TODO: Get from toppers10 array when integrated
            onAddPhoto={() => console.log('Add class 10 topper')}
            onRemovePhoto={() => console.log('Remove class 10 topper')}
            onReorderPhotos={() => console.log('Reorder class 10 toppers')}
            emptyMessage="Class 10 toppers are currently using external images. Upload local photos to replace them."
          />
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> Class 10 topper data is currently stored in{' '}
              <code className="text-xs">src/data.ts (toppers10 array)</code>.
              These need to be migrated to use the new photo management system.
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
          <li>• Crop to 1:1 aspect ratio</li>
          <li>• Link to student achievement data</li>
          <li>• Live preview on Higher Secondary page</li>
          <li>• Migrate Class 10 data from external URLs</li>
          <li>• Save to persistent storage</li>
        </ul>
      </div>
    </div>
  );
}
