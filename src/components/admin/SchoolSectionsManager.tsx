import { useEffect } from 'react';
import { useSingleSlot } from '../../hooks/useSingleSlot';
import { SectionHeader } from './SectionHeader';
import { SinglePhotoManager } from './SinglePhotoManager';
import { LegacyImportNotice } from './LegacyImportNotice';

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

const configKeyFor = (id: string) => `schoolSectionPhotos.${id}`;

function SectionCard({ id, title, description }: { id: string; title: string; description: string }) {
  const slot = useSingleSlot(configKeyFor(id));
  const { reload } = slot;

  useEffect(() => {
    const onImported = () => void reload();
    window.addEventListener('school-sections-imported', onImported);
    return () => window.removeEventListener('school-sections-imported', onImported);
  }, [reload]);

  return (
    <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
      <SinglePhotoManager
        title={title}
        description={description}
        currentPhoto={slot.current}
        onUpdate={(photo) => {
          void slot.update(photo);
        }}
        onRemove={() => {
          void slot.remove();
        }}
      />
    </div>
  );
}

export function SchoolSectionsManager() {
  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="School Sections Cards"
        description="Manage images for the 'Find Your Learning Stage' cards on the home page. Each card links to a school section page."
      />

      <LegacyImportNotice
        configKeys={sections.map((section) => configKeyFor(section.id))}
        onImported={() => window.dispatchEvent(new Event('school-sections-imported'))}
      />

      <div className="space-y-6">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.description}
          />
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
