import { motion, useReducedMotion } from "motion/react";
import { Icon } from "./Icon";
import type { ContentItem } from "../services/contentItemsApi";

interface ContentItemCardsProps {
  items: ContentItem[];
  loading?: boolean;
}

export function ContentItemCards({ items, loading }: ContentItemCardsProps) {
  const shouldReduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="aspect-[16/10] overflow-hidden rounded-3xl bg-school-navy/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 0.55,
            delay: shouldReduceMotion ? 0 : 0.12 * index,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="group overflow-hidden rounded-3xl border border-school-navy/8 bg-white shadow-[0_12px_35px_rgba(11,23,54,0.08)] transition-shadow duration-300 hover:border-school-gold/50 hover:shadow-[0_22px_48px_rgba(11,23,54,0.14)]"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-school-navy">
            {item.media?.image_url ? (
              <img
                src={item.media.image_url}
                alt={item.media.alt_text || item.title}
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
                  Content imagery
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-school-navy/85 via-school-navy/10 to-transparent" />
          </div>

          <div className="p-6 sm:p-7">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-school-navy">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-2 min-h-12 text-sm leading-relaxed text-school-muted">
                {item.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
