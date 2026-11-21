import { useState } from 'react';
import { Icon } from './Icon';
import { usePublicApi } from '../hooks/usePublicApi';

interface Sport {
  id: string;
  name: string;
  description: string;
  media?: { image_url: string } | null;
}

export function SportsCarousel() {
  const { data: sports, loading } = usePublicApi<Sport[]>('/api/public/sports', []);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) return <div className="text-center py-12 text-school-muted">Loading sports...</div>;

  if (sports.length === 0) {
    return (
      <section className="py-24 bg-white">
        <div className="text-center text-school-muted">
          <p className="text-lg">No sports information available yet.</p>
        </div>
      </section>
    );
  }

  const currentSport = sports[currentIndex];
  const goNext = () => setCurrentIndex((i) => (i + 1) % sports.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + sports.length) % sports.length);

  return (
    <section className="py-24 bg-school-cream">
      <div className="mx-auto max-w-5xl px-6 lg:px-16">
        <h2 className="font-serif text-3xl font-bold text-school-navy mb-12 text-center">Our Sports</h2>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-2 items-center">
          {/* Photo */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-school-navy/10 to-school-navy/5">
            {currentSport.media?.image_url ? (
              <img
                src={currentSport.media.image_url}
                alt={currentSport.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-school-muted">
                <Icon name="image" className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Content and Navigation */}
          <div className="space-y-6">
            <div className="min-w-0">
              <h3 className="font-serif text-3xl font-bold text-school-navy break-words">{currentSport.name}</h3>
              <p className="mt-4 text-base leading-relaxed text-school-muted break-words">{currentSport.description}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={goPrev}
                className="rounded-full bg-school-gold p-3 text-school-navy hover:bg-school-gold-hover transition-colors"
                aria-label="Previous sport"
              >
                <Icon name="arrow" className="h-5 w-5 rotate-180" />
              </button>

              <div className="flex-1 text-center">
                <span className="text-sm font-semibold text-school-muted">
                  {currentIndex + 1} of {sports.length}
                </span>
              </div>

              <button
                onClick={goNext}
                className="rounded-full bg-school-gold p-3 text-school-navy hover:bg-school-gold-hover transition-colors"
                aria-label="Next sport"
              >
                <Icon name="arrow" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
