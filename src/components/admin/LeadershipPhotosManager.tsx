import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { SinglePhotoManager } from './SinglePhotoManager';

export function LeadershipPhotosManager() {
  const { config, updateLeadershipPhotos } = usePhotoConfig();

  const leaders = [
    {
      id: 'managementPhoto',
      title: 'Management Profile',
      description: 'Upload the management profile photograph (displayed in 4:3 aspect ratio)',
      currentPhoto: config.leadershipPhotos.managementPhoto,
    },
    {
      id: 'trusteePhoto',
      title: 'Trustee Profile',
      description: 'Upload the trustee profile photograph',
      currentPhoto: config.leadershipPhotos.trusteePhoto,
    },
    {
      id: 'principalPhoto',
      title: 'School Head / Principal Profile',
      description: 'Upload the principal or school head profile photograph',
      currentPhoto: config.leadershipPhotos.principalPhoto,
    },
  ];

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Leadership Profiles"
        description="Manage photographs for leadership profiles displayed on the home page. Each profile shows a professional portrait with name, designation, and message."
      />

      <div className="space-y-6">
        {leaders.map((leader) => (
          <div
            key={leader.id}
            className="rounded-2xl border border-school-navy/10 bg-white p-8"
          >
            <SinglePhotoManager
              title={leader.title}
              description={leader.description}
              currentPhoto={leader.currentPhoto}
              onUpdate={(photo) => {
                updateLeadershipPhotos({
                  [leader.id]: photo,
                });
              }}
              onRemove={() => {
                updateLeadershipPhotos({
                  [leader.id]: null,
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
          <li>• Image crop/resize (4:3 aspect ratio)</li>
          <li>• Live preview on home page</li>
          <li>• Save to persistent storage</li>
        </ul>
      </div>
    </div>
  );
}
