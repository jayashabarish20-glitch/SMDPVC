import { usePublicApi } from '../hooks/usePublicApi';
import { MediaImage } from './MediaImage';
import { mediaUrl, type MediaRef } from '../utils/mediaUrl';

interface Achievement {
  id: string;
  description: string;
  media?: MediaRef | null;
}

export function SportsAchievementsGallery() {
  const { data: achievements, loading } = usePublicApi<Achievement[]>('/api/public/sports-achievements', []);

  if (loading) return <div className="text-center py-12 text-school-muted">Loading achievements...</div>;

  if (achievements.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-school-cream">
      <div className="mx-auto max-w-6xl px-6 lg:px-16">
        <h2 className="font-serif text-3xl font-bold text-school-navy mb-12 text-center">Sports Achievements</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="rounded-2xl overflow-hidden border border-school-navy/10 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gradient-to-br from-school-navy/10 to-school-navy/5 overflow-hidden">
                <MediaImage
                  src={mediaUrl(achievement.media)}
                  alt={achievement.description}
                  className="w-full h-full object-cover"
                />
              </div>
              {achievement.description && (
                <div className="p-4">
                  <p className="text-sm text-school-muted break-words">{achievement.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
