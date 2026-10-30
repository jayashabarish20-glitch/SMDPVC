import { campusImages, clubs } from "../data";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function CampusLife() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="campus-life" className="relative scroll-mt-20 bg-school-navy py-24 lg:py-36 text-white overflow-hidden">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Beyond Academics
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Vibrant Campus Life
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Fostering creative exploration, leadership capabilities, social responsibility,
            and lifelong camaraderie outside the conventional classroom.
          </p>
        </div>

        {/* Student Clubs Bento Grid */}
        <div className="mb-20">
          <h3 className="mb-8 font-serif text-2xl font-bold text-white/95">
            Student Societies &amp; Co-curricular Clubs
          </h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <div
                key={club.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08] hover:border-school-gold/40 hover:-translate-y-1"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-school-gold transition-colors duration-300 group-hover:bg-school-gold group-hover:text-school-navy">
                  <Icon name={club.icon} className="h-6 w-6" />
                </span>
                <h4 className="mt-5 font-serif text-xl font-bold text-white group-hover:text-school-gold-light transition-colors">
                  {club.title}
                </h4>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/65">
                  {club.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Alumni Spotlight */}
        <div className="pt-12 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-school-gold">
                Distinguished Heritage
              </p>
              <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-white">
                Alumni Spotlight
              </h3>
            </div>
            <p className="mt-2 sm:mt-0 text-xs text-white/60">
              Our graduates pioneering industries and making global impact
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {campusImages.alumni.map((person) => (
              <div
                key={person.name}
                className="flex flex-col justify-between rounded-3xl bg-white p-7 text-school-navy shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <img
                      src={person.image}
                      alt={person.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-school-gold"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="font-serif text-base font-bold text-school-navy">
                        {person.name}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-school-gold-hover">
                        {person.batch}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-bold text-school-muted">
                    {person.role}
                  </p>
                </div>
                <blockquote className="mt-6 border-l-2 border-school-gold pl-3.5 text-xs sm:text-sm italic leading-relaxed text-school-muted-light">
                  &ldquo;{person.quote}&rdquo;
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

