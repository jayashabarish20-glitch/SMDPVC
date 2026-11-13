import { motion, useReducedMotion } from "motion/react";
import { usePhotoConfig } from "../hooks/usePhotoConfig";

export function Infrastructure() {
  const shouldReduceMotion = useReducedMotion();
  const { config } = usePhotoConfig();
  const infrastructure = config.groupOfSchoolsInfrastructure ?? { photos: [], description: '' };
  const items = infrastructure.photos;

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id="infrastructure"
      className="scroll-mt-20 bg-white py-24 lg:py-36"
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
            Our Facilities
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            World-Class Infrastructure
          </h2>
        </motion.div>

        {/* Photo grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.65,
                delay: shouldReduceMotion ? 0 : 0.1 * index,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-2xl overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
                {photo.dataUrl && (
                  <img
                    src={photo.dataUrl}
                    alt={photo.alt || 'Infrastructure'}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Description */}
        {infrastructure.description && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.65,
              delay: shouldReduceMotion ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto mt-12 max-w-3xl text-center"
          >
            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-school-muted sm:text-base">
              {infrastructure.description}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
