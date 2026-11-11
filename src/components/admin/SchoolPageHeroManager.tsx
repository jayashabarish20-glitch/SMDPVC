import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { PhotoGridManager } from './PhotoGridManager';

interface SchoolPageHeroManagerProps {
  pageKey: 'nursery' | 'primary' | 'higherSecondary';
  pageTitle: string;
  pagePath: string;
  description: string;
}

export function SchoolPageHeroManager({
  pageKey,
  pageTitle,
  pagePath,
  description,
}: SchoolPageHeroManagerProps) {
  const { config, updateSchoolPageHeroes, addPhoto, removePhoto } =
    usePhotoConfig();

  const photos = config.schoolPageHeroes[pageKey];

  return (
    <div>
      <SectionHeader
        badge={pageTitle.toUpperCase()}
        title={`${pageTitle} Page Hero Carousel`}
        description={description}
      />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
        <PhotoGridManager
          title={`${pageTitle} Hero Images`}
          photos={photos}
          onAddPhoto={(photo) => {
            addPhoto(`schoolPageHeroes.${pageKey}`, photo);
          }}
          onRemovePhoto={(id) => {
            removePhoto(`schoolPageHeroes.${pageKey}`, id);
          }}
          onReorderPhotos={(reorderedPhotos) => {
            updateSchoolPageHeroes({
              [pageKey]: reorderedPhotos,
            });
          }}
          emptyMessage={`No hero images added for ${pageTitle} yet.`}
          maxPhotos={3}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-school-gold/20 bg-school-gold/5 p-6">
        <p className="text-sm font-medium text-school-navy">
          💡 <strong>Features not yet implemented:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-school-muted">
          <li>• Photo upload and validation</li>
          <li>• Drag-to-reorder images</li>
          <li>• Live carousel preview</li>
          <li>• Save to persistent storage</li>
          <li>
            • View page at <code className="text-xs">{pagePath}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
