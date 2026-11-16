import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { usePhotoConfig } from "../hooks/usePhotoConfig";
import { Icon } from "./Icon";
import type { PhotoMetadata } from "../data/photoService";

export function Infrastructure() {
  const shouldReduceMotion = useReducedMotion();
  const { config } = usePhotoConfig();
  const infrastructure = config.groupOfSchoolsInfrastructure ?? { photos: [], description: '' };
  const photos: PhotoMetadata[] = infrastructure.photos ?? [];

  if (photos.length === 0) {
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

        <GalleryDisplay
          photos={photos}
          description={infrastructure.description ?? ''}
          shouldReduceMotion={!!shouldReduceMotion}
          fullScreen={infrastructure.fullScreen ?? true}
        />
      </div>
    </section>
  );
}

// ─── Gallery Display (reusable carousel with fullscreen) ────────────────────

interface GalleryDisplayProps {
  photos: PhotoMetadata[];
  description: string;
  shouldReduceMotion: boolean;
  fullScreen?: boolean;
}

function GalleryDisplay({
  photos,
  description,
  shouldReduceMotion,
  fullScreen = false,
}: GalleryDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = photos.length;

  const goToNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const goToPrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const goToDot = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);

  const lightboxNext = () => goToNext();
  const lightboxPrev = () => goToPrev();

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "60%" : "-60%",
      opacity: 0,
    }),
    center: { x: "0%", opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-60%" : "60%",
      opacity: 0,
    }),
  };

  const currentPhoto = photos[activeIndex];

  return (
    <div className="mt-8">
      {/* ── Carousel container ── */}
      <div className="relative mx-auto w-full max-w-2xl select-none">
        {/* Fixed-height image stage */}
        <div className="relative h-72 sm:h-96 overflow-hidden rounded-2xl border border-school-navy/8 bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep shadow-md">
          {/* Animated slide */}
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={shouldReduceMotion ? undefined : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentPhoto?.dataUrl ? (
                <img
                  src={currentPhoto.dataUrl}
                  alt={currentPhoto.alt || `Infrastructure photo ${activeIndex + 1}`}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/40">
                  <Icon name="image" className="h-12 w-12" />
                  <span className="text-xs font-semibold uppercase tracking-widest">No image</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Left arrow ── */}
          {total > 1 && (
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-school-navy/85 active:scale-95"
            >
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
            </button>
          )}

          {/* ── Right arrow ── */}
          {total > 1 && (
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-school-navy/85 active:scale-95"
            >
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          )}

          {/* ── Image counter badge (top-right) ── */}
          {total > 1 && (
            <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              {activeIndex + 1} / {total}
            </span>
          )}
        </div>

        {/* ── Bottom controls row: dots + fullscreen ── */}
        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          {/* Pagination dots */}
          {total > 1 ? (
            <div className="flex items-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToDot(i)}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                >
                  <span
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "h-2.5 w-2.5 bg-school-gold"
                        : "h-2 w-2 bg-school-navy/25 hover:bg-school-navy/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : (
            <span /> /* spacer so fullscreen stays right-aligned with 1 photo */
          )}

          {/* Fullscreen button */}
          {fullScreen && (
            <button
              type="button"
              onClick={openLightbox}
              className="inline-flex items-center gap-1.5 rounded-lg border border-school-navy/15 bg-white px-3 py-1.5 text-xs font-semibold text-school-navy shadow-sm transition-colors hover:bg-school-cream"
            >
              <Icon name="image" className="h-3.5 w-3.5 text-school-gold" />
              View Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Gallery description */}
      {description.trim() && (
        <p className="mt-5 text-sm leading-relaxed text-school-muted">
          {description}
        </p>
      )}

      {/* ── Fullscreen Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              type="button"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={closeLightbox}
              aria-label="Close fullscreen"
            >
              <Icon name="x" className="h-6 w-6" />
            </button>

            {/* Image */}
            <div className="relative flex h-full w-full items-center justify-center">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.img
                  key={activeIndex}
                  src={photos[activeIndex].dataUrl}
                  alt={photos[activeIndex].alt || "Fullscreen"}
                  custom={direction}
                  variants={shouldReduceMotion ? undefined : slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                />
              </AnimatePresence>

              {/* Navigation */}
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      lightboxPrev();
                    }}
                    className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label="Previous image"
                  >
                    <Icon name="arrow" className="h-6 w-6 rotate-180" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      lightboxNext();
                    }}
                    className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label="Next image"
                  >
                    <Icon name="arrow" className="h-6 w-6" />
                  </button>

                  {/* Dot indicators inside lightbox */}
                  <div className="absolute bottom-6 flex items-center gap-2">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToDot(i);
                        }}
                        className="flex h-8 w-8 items-center justify-center"
                        aria-label={`Go to image ${i + 1}`}
                      >
                        <span
                          className={`rounded-full transition-all ${
                            i === activeIndex
                              ? "h-2.5 w-2.5 bg-school-gold"
                              : "h-2 w-2 bg-white/40 hover:bg-white/60"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
