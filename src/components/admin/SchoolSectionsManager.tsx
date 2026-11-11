import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { SinglePhotoManager } from './SinglePhotoManager';

export function SchoolSectionsManager() {
  const { config, updateSchoolSectionPhotos } = usePhotoConfig();

  const sections = [
    {
      id: 'nursery',
      title: 'Nursery Section Card',
      description: 'Home page card image for Nursery section (16:10 aspect ratio)',
    },
    {
      id: 'primary',
      title: 'Primary Section Card',
      description: 'Home page card image for Primary section (16:10 aspect ratio)',
    },
    {
      id: 'higherSecondary',
      title: 'Higher Secondary Section Card',
      description: 'Home page card image for Higher Secondary section (16:10 aspect ratio)',
    },
  ];

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="School Sections Cards"
        description="Manage images for the 'Find Your Learning Stage' cards on the home page. Each card links to a school section page."
      />

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-2xl border border-school-navy/10 bg-white p-8"
          >
            <SinglePhotoManager
              title={section.title}
              description={section.description}
              currentPhoto={
                config.schoolSectionPhotos[
                  section.id as keyof typeof config.schoolSectionPhotos
                ]
              }
              onUpdate={(photo) => {
                updateSchoolSectionPhotos({
                  [section.id]: photo,
                });
              }}
              onRemove={() => {
                updateSchoolSectionPhotos({
                  [section.id]: null,
                });
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-school-gold/20 bg-school-gold/5 p-6">
        <p className="text-sm font-medium text-school-navy">
          💡 <strong>Features not yet implemented:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-school-muted">
          <li>• Photo upload and validation</li>
          <li>• Image crop (16:10 aspect ratio)</li>
          <li>• Live preview on home page</li>
          <li>• Save to persistent storage</li>
        </ul>
      </div>
    </div>
  );
}
