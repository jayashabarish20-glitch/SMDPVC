import { Icon } from './Icon';
import { usePublicApi } from '../hooks/usePublicApi';

interface AcademicInfo {
  id: string;
  title: string;
  description: string;
  media?: { image_url: string } | null;
}

export function AcademicInformationSection() {
  const { data: infos, loading } = usePublicApi<AcademicInfo[]>('/api/public/academic-information', []);

  if (loading) return <div className="text-center py-12 text-school-muted">Loading information...</div>;

  if (infos.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-4xl px-6 lg:px-16">
        <h2 className="font-serif text-3xl font-bold text-school-navy mb-12 text-center">Academic Information</h2>

        <div className="space-y-4">
          {infos.map((info) => (
            <div
              key={info.id}
              className="flex items-center justify-between p-5 rounded-lg border border-school-navy/10 bg-school-cream hover:bg-school-cream-alt transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon name="book" className="h-5 w-5 text-school-gold flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-school-navy break-words">{info.title}</h3>
                  {info.description && (
                    <p className="text-sm text-school-muted break-words">{info.description}</p>
                  )}
                </div>
              </div>

              {info.media?.image_url && (
                <a
                  href={info.media.image_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="ml-4 px-4 py-2 rounded-lg bg-school-gold text-school-navy font-semibold text-sm hover:bg-school-gold-hover transition-colors whitespace-nowrap"
                >
                  Download
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
