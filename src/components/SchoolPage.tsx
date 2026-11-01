import { motion, useReducedMotion } from "motion/react";
import type { SchoolPageConfig } from "../schoolPageData";
import { Hero } from "./Hero";

type SchoolPageProps = {
  page: SchoolPageConfig;
};

export function SchoolPage({ page }: SchoolPageProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main
      id="main-content"
      className="min-h-screen bg-school-cream text-school-navy"
    >
      <Hero pageHero={page.hero} pageTitle={page.title} />
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-12 lg:px-16 lg:py-16">
        {page.sections.map((section, index) => (
          <motion.section
            key={section.id}
            id={section.id}
            initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.6,
              delay: shouldReduceMotion ? 0 : 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
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
                {section.subsections.map((subsection, subIndex) => (
                  <motion.article
                    key={subsection}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{
                      duration: 0.45,
                      delay: shouldReduceMotion ? 0 : 0.65 + subIndex * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                    className="rounded-2xl border border-school-navy/8 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <h3 className="font-serif text-lg font-bold text-school-navy">
                      {subsection}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-school-muted">
                      {section.title === "Achievements"
                        ? "Add verified school data here."
                        : section.description}
                    </p>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.section>
        ))}
      </div>
    </main>
  );
}
