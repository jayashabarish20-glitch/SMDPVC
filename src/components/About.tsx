import { foundationContent } from "../homepageContent";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function About() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const statements = [
    { ...foundationContent.vision, icon: "target" as const },
    { ...foundationContent.mission, icon: "leaf" as const },
  ];

  return (
    <section
      id="foundation"
      className="relative scroll-mt-20 overflow-hidden bg-school-cream py-24 lg:py-36"
    >
      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-school-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-school-navy/5 blur-3xl" />

      <div
        ref={ref}
        className={`relative mx-auto max-w-7xl px-6 transition-all duration-1000 lg:px-16 ${
          isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Our Foundation
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            A Foundation for Learning
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {statements.map((statement) => (
            <article
              key={statement.title}
              className="group rounded-3xl border border-school-navy/8 bg-white p-8 shadow-[0_10px_35px_rgba(11,23,54,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-school-gold/40 hover:shadow-[0_18px_42px_rgba(11,23,54,0.09)] sm:p-10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-school-gold/15 text-school-gold transition-colors duration-300 group-hover:bg-school-gold group-hover:text-school-navy">
                <Icon name={statement.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-serif text-2xl font-bold text-school-navy">
                {statement.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-school-muted sm:text-base">
                {statement.description}
              </p>
              {statement.isDemo && (
                <p className="mt-5 border-t border-school-navy/10 pt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-school-gold-hover">
                  Editable demo copy — replace with the school-approved statement
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
