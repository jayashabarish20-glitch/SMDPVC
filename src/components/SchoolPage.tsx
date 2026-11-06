import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { SchoolPageConfig } from "../schoolPageData";
import type { PhotoMetadata } from "../data/photoService";
import { Hero } from "./Hero";
import { usePhotoConfig } from "../hooks/useAdminPhotos";
import { Icon } from "./Icon";

type SchoolPageProps = {
  page: SchoolPageConfig;
};

export function SchoolPage({ page }: SchoolPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const photoConfig = usePhotoConfig();

  // Primary Classes Gallery data — read only when on the primary page
  const isPrimaryPage = page.title === "Primary";
  const galleryData = isPrimaryPage
    ? (photoConfig.primaryClassesGallery ?? { photos: [], description: "" })
    : null;
  const primaryAboutData = isPrimaryPage ? photoConfig.primaryAbout : null;

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
            {section.id === "primary-about" && primaryAboutData ? (
              <div className="mt-6 grid items-center gap-6 lg:grid-cols-2">
                {primaryAboutData.photo?.dataUrl && (
                  <div className="flex max-h-[28rem] min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-school-navy/8 bg-school-cream-alt">
                    <img
                      src={primaryAboutData.photo.dataUrl}
                      alt={primaryAboutData.photo.alt || "Primary About"}
                      className="max-h-[28rem] w-full object-contain"
                    />
                  </div>
                )}
                {primaryAboutData.description && (
                  <p className="whitespace-pre-line text-sm font-bold leading-relaxed text-school-muted sm:text-base">
                    {primaryAboutData.description}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-school-muted sm:text-base">
                {section.description}
              </p>
            )}
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

            {/* ── Primary Classes Gallery ── */}
            {section.id === "primary-classes" &&
              galleryData != null &&
              galleryData.photos.length > 0 && (
                <PrimaryClassesGallery
                  photos={galleryData.photos}
                  description={galleryData.description}
                  shouldReduceMotion={!!shouldReduceMotion}
                />
              )}
          </motion.section>
        ))}
      </div>
    </main>
  );
}

// ─── Primary Classes Gallery (public display) ─────────────────────────────────

interface PrimaryClassesGalleryProps {
  photos: PhotoMetadata[];
  description: string;
  shouldReduceMotion: boolean;
}

function PrimaryClassesGallery({
  photos,
  description,
  shouldReduceMotion,
}: PrimaryClassesGalleryProps) {
  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = forward, -1 = backward

  // Lightbox state (tracks which photo to show in fullscreen — always the active slide)
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

  // Lightbox also navigates the carousel
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
                  alt={currentPhoto.alt || `Classes photo ${activeIndex + 1}`}
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
          <button
            type="button"
            onClick={openLightbox}
            className="inline-flex items-center gap-1.5 rounded-lg border border-school-navy/15 bg-white px-3 py-1.5 text-xs font-semibold text-school-navy shadow-sm transition-colors hover:bg-school-cream"
          >
            <Icon name="image" className="h-3.5 w-3.5 text-school-gold" />
            View Fullscreen
          </button>
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
              <Icon name="x" className="h-5 w-5" />
            </button>

            {/* Prev */}
            {total > 1 && (
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                aria-label="Previous photo"
              >
                <Icon name="arrow" className="h-5 w-5 rotate-180" />
              </button>
            )}

            {/* Fullscreen image — always shows the active carousel slide */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.img
                key={activeIndex}
                custom={direction}
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                src={photos[activeIndex]?.dataUrl ?? ""}
                alt={photos[activeIndex]?.alt || `Classes photo ${activeIndex + 1}`}
                className="max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {/* Next */}
            {total > 1 && (
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                aria-label="Next photo"
              >
                <Icon name="arrow" className="h-5 w-5" />
              </button>
            )}

            {/* Dot indicators inside lightbox */}
            {total > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goToDot(i); }}
                    aria-label={`Go to image ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "h-2.5 w-2.5 bg-school-gold"
                        : "h-2 w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
