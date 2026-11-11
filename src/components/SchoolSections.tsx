import { motion, useReducedMotion } from "motion/react";
import { schoolSectionCards } from "../homepageContent";
import { Icon } from "./Icon";
import { usePhotoConfig } from "../hooks/useAdminPhotos";

export function SchoolSections() {
  const shouldReduceMotion = useReducedMotion();
  const photoConfig = usePhotoConfig();

  const cards = [...schoolSectionCards]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((card) => {
      let image = card.image;

      // Override with admin photo if available
      if (card.href === '/nursery' && photoConfig.schoolSectionPhotos.nursery?.imageUrl) {
        image = photoConfig.schoolSectionPhotos.nursery.imageUrl;
      } else if (card.href === '/primary' && photoConfig.schoolSectionPhotos.primary?.imageUrl) {
        image = photoConfig.schoolSectionPhotos.primary.imageUrl;
      } else if (card.href === '/higher-secondary' && photoConfig.schoolSectionPhotos.higherSecondary?.imageUrl) {
        image = photoConfig.schoolSectionPhotos.higherSecondary.imageUrl;
      }

      return { ...card, image };
    });

  return (
    <section
      id="school-sections"
      className="scroll-mt-20 bg-school-cream-alt py-24 lg:py-36"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
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
            School Sections
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Find Your Learning Stage
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((section, index) => (
            <motion.a
              key={section.href}
              href={section.href}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.55,
                delay: shouldReduceMotion ? 0 : 0.65 + index * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              whileTap={{ scale: 0.98 }}
              className="group overflow-hidden rounded-3xl border border-school-navy/8 bg-white shadow-[0_12px_35px_rgba(11,23,54,0.08)] transition-shadow duration-300 hover:border-school-gold/50 hover:shadow-[0_22px_48px_rgba(11,23,54,0.14)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-school-gold"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-school-navy">
                {section.image ? (
                  <img
                    src={section.image}
                    alt={section.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top_right,_var(--color-school-navy-light),_var(--color-school-deep)_72%)] text-school-gold"
                  >
                    <Icon name="book" className="h-9 w-9 opacity-80" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
                      School imagery
                    </span>
                  </div>
                )}
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
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
                  />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
