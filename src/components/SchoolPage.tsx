import type { SchoolPageConfig } from "../schoolPageData";
import { Hero } from "./Hero";

type SchoolPageProps = {
  page: SchoolPageConfig;
};

export function SchoolPage({ page }: SchoolPageProps) {
  return (
    <main className="min-h-screen bg-school-cream text-school-navy">
      <Hero pageHero={page.hero} pageTitle={page.title} />
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-12 lg:px-16 lg:py-16">
        {page.sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={`scroll-mt-24 rounded-3xl border border-school-navy/8 p-7 shadow-[0_10px_35px_rgba(11,23,54,0.04)] sm:p-10 ${
              index % 2 === 0 ? "bg-white" : "bg-school-cream-alt"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              {page.title}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-school-navy sm:text-3xl">
              {section.title}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-school-muted sm:text-base">
              {section.description}
            </p>
            {section.subsections && (
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.subsections.map((subsection) => (
                  <article
                    key={subsection}
                    className="rounded-2xl border border-school-navy/8 bg-white p-5"
                  >
                    <h3 className="font-serif text-lg font-bold text-school-navy">
                      {subsection}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-school-muted">
                      {section.title === "Achievements"
                        ? "Add verified school data here."
                        : section.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
