import { motion, useReducedMotion } from "motion/react";
import { foundationContent } from "../homepageContent";
import { Icon } from "./Icon";

export function About() {
  const shouldReduceMotion = useReducedMotion();
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

      <div className="relative mx-auto max-w-7xl px-6 lg:px-16">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.65,
            delay: shouldReduceMotion ? 0 : 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Our Foundation
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            A Foundation for Learning
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {statements.map((statement, index) => (
            <motion.article
              key={statement.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.55,
                delay: shouldReduceMotion ? 0 : 0.65 + index * 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              className="group rounded-3xl border border-school-navy/8 bg-white p-8 shadow-[0_10px_35px_rgba(11,23,54,0.05)] transition-shadow duration-300 hover:border-school-gold/40 hover:shadow-[0_20px_45px_rgba(11,23,54,0.1)] sm:p-10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-school-gold/15 text-school-gold transition-all duration-300 group-hover:scale-105 group-hover:bg-school-gold group-hover:text-school-navy">
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
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
