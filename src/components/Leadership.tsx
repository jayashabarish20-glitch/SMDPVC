import { leadershipProfiles } from "../homepageContent";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function Leadership() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const profiles = leadershipProfiles
    .filter((profile) => profile.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section id="leadership" className="scroll-mt-20 bg-white py-24 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 transition-all duration-1000 lg:px-16 ${
          isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Leadership
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Meet Our School Leaders
          </h2>
          <p className="mt-4 text-base leading-relaxed text-school-muted">
            Leadership profiles will be completed with school-approved names,
            photographs, and messages.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <article
              key={profile.id}
              className="group overflow-hidden rounded-3xl border border-school-navy/8 bg-school-cream shadow-[0_10px_35px_rgba(11,23,54,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-school-gold/40 hover:shadow-[0_18px_42px_rgba(11,23,54,0.1)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={`${profile.name}, ${profile.designation}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-school-gold/40 bg-white/5 text-school-gold">
                      <Icon name="graduation" className="h-8 w-8" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                      Leader photograph to be added
                    </span>
                  </div>
                )}
                <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-school-navy/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-school-gold-light backdrop-blur-sm">
                  {profile.category}
                </span>
              </div>

              <div className="p-6 sm:p-7">
                <h3 className="font-serif text-xl font-bold text-school-navy">
                  {profile.name}
                </h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-school-gold-hover">
                  {profile.designation}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-school-muted">
                  {profile.shortBio}
                </p>
                <blockquote className="mt-5 border-l-2 border-school-gold pl-4 text-sm italic leading-relaxed text-school-muted">
                  {profile.message ||
                    "Add an approved message from this leader here once the author and wording are confirmed."}
                </blockquote>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
