import { schoolSectionCards } from "../homepageContent";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function SchoolSections() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const cards = [...schoolSectionCards].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <section
      id="school-sections"
      className="scroll-mt-20 bg-school-cream-alt py-24 lg:py-36"
    >
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 transition-all duration-1000 lg:px-16 ${
          isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            School Sections
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Find Your Learning Stage
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="group overflow-hidden rounded-3xl border border-school-navy/8 bg-white shadow-[0_12px_35px_rgba(11,23,54,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-school-gold/50 hover:shadow-[0_22px_48px_rgba(11,23,54,0.14)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-school-gold"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-school-navy">
                <img
                  src={section.image}
                  alt={section.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-school-navy/85 via-school-navy/10 to-transparent" />
                <span className="absolute bottom-5 left-6 rounded-full border border-white/25 bg-school-navy/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-school-gold-light backdrop-blur-sm">
                  {section.category}
                </span>
              </div>

              <div className="p-6 sm:p-7">
                <h3 className="font-serif text-2xl font-bold tracking-tight text-school-navy">
                  {section.title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-school-muted">
                  {section.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-school-gold-hover transition-colors group-hover:text-school-navy">
                  Explore Section
                  <Icon
                    name="arrow"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
