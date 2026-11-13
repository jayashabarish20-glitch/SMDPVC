import { motion, useReducedMotion } from "motion/react";
import { usePublicContentItems } from "../hooks/usePublicContentItems";
import { ContentItemCards } from "./ContentItemCards";

export function Infrastructure() {
  const shouldReduceMotion = useReducedMotion();
  const { items, loading } = usePublicContentItems({
    pageName: "home",
    sectionKey: "infrastructure",
  });

  if (loading) {
    return (
      <section
        id="infrastructure"
        className="scroll-mt-20 bg-white py-24 lg:py-36"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
              Our Facilities
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
              World-Class Infrastructure
            </h2>
          </div>
          <ContentItemCards items={[]} loading={true} />
        </div>
      </section>
    );
  }

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

        <ContentItemCards items={items} />
      </div>
    </section>
  );
}
