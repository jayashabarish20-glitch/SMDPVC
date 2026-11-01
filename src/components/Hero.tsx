import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { campusImages, heroSlides } from "../data";
import type { SchoolPageConfig } from "../schoolPageData";
import { Icon, scrollToSection } from "./Icon";

type HeroProps = {
  pageHero?: SchoolPageConfig["hero"];
  pageTitle?: string;
};

type GalleryImageProps = {
  src: string;
  alt: string;
  className: string;
};

function GalleryImage({ src, alt, className }: GalleryImageProps) {
  if (src) {
    return (
      <img
        className={className}
        src={src}
        alt={alt}
        loading="lazy"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${alt}; school-approved image to be added`}
      className={`${className} flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-school-cream-alt to-white p-3 text-center`}
    >
      <Icon name="book" className="h-7 w-7 text-school-gold" />
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-school-navy/65">
        School-approved image to be added
      </span>
    </div>
  );
}

export function Hero({ pageHero, pageTitle }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const [galleryTilt, setGalleryTilt] = useState({ x: 0, y: 0 });
  const slides = pageHero?.slides ?? heroSlides;
  const images = useMemo(
    () =>
      (pageHero?.images ?? campusImages.hero).filter(
        (image): image is string => Boolean(image),
      ),
    [pageHero?.images],
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const intervalTime = pageHero ? 4500 : 5500;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [pageHero, slides.length]);

  useEffect(() => {
    setActiveSlide(0);
  }, [pageHero]);

  useEffect(() => {
    images.forEach((image) => {
      const preloadedImage = new Image();
      preloadedImage.src = image;
    });
  }, [images]);

  const updateGalleryTilt = (e: PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - bounds.left) / bounds.width - 0.5;
    const yRatio = (e.clientY - bounds.top) / bounds.height - 0.5;
    setGalleryTilt({
      x: Math.round(-yRatio * 18),
      y: Math.round(xRatio * 18),
    });
  };

  const currentSlide = slides[activeSlide];

  return (
    <section
      id={pageHero ? undefined : "home"}
      className="relative flex min-h-[640px] h-[100svh] flex-col justify-end overflow-hidden bg-school-deep pt-20"
      aria-label={pageHero ? `${pageTitle} highlights` : "School highlights"}
      aria-roledescription="carousel"
    >
      {/* Background Slides with Apple-grade cinematic cross-fade */}
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === activeSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          style={{ transitionProperty: "opacity, transform", transitionDuration: "1200ms" }}
          aria-hidden="true"
        >
          <img
            className="h-full w-full object-cover"
            src={image}
            alt=""
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Cinematic dark radial & gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-school-navy via-school-navy/60 to-school-navy/35 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[at_top_right] from-school-gold/15 via-transparent to-transparent pointer-events-none" />

      {/* Desktop 3D Interactive Floating Perspective Deck */}
      <div
        className="absolute right-[4%] top-[22%] z-[1] hidden h-[48vh] w-[40vw] max-w-[540px] xl:block pointer-events-auto"
        style={{ perspective: "1400px" }}
        onPointerMove={updateGalleryTilt}
        onPointerLeave={() => setGalleryTilt({ x: 0, y: 0 })}
        role="group"
        aria-label="Representative school imagery"
      >
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [-10, 10, -10] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{
              transform: `rotateX(${galleryTilt.x}deg) rotateY(${galleryTilt.y}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Card 1: Sports & Extracurricular */}
            <div
              className="absolute left-[20%] top-[60%] h-[54%] w-[45%]"
              style={{
                transform: "translate(-50%, -50%) rotateY(20deg) rotateZ(-6deg) translateZ(-40px)",
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                animate={shouldReduceMotion ? undefined : { y: [-6, 6, -6] }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative h-full w-full overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-2 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-105"
              >
                <GalleryImage
                  className="h-full w-full rounded-xl object-cover"
                  src={campusImages.sports}
                  alt="Students taking part in school sports"
                />
                <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-school-navy">
                  Campus Activities
                </span>
              </motion.div>
            </div>

            {/* Card 2: Leadership & Community */}
            <div
              className="absolute left-[82%] top-[34%] h-[48%] w-[40%]"
              style={{
                transform: "translate(-50%, -50%) rotateY(-18deg) rotateZ(6deg) translateZ(-15px)",
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                animate={shouldReduceMotion ? undefined : { y: [6, -6, 6] }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative h-full w-full overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-2 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-105"
              >
                <GalleryImage
                  className="h-full w-full rounded-xl object-cover object-top"
                  src={campusImages.principal}
                  alt="School leadership"
                />
                <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-school-navy">
                  School Community
                </span>
              </motion.div>
            </div>

            {/* Card 3: Main Classroom & Lab Focus */}
            <div
              className="absolute left-[50%] top-[50%] h-[72%] w-[62%]"
              style={{
                transform: "translate(-50%, -50%) rotateY(-6deg) rotateX(4deg) translateZ(60px)",
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                animate={shouldReduceMotion ? undefined : { y: [-8, 8, -8] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative h-full w-full overflow-hidden rounded-3xl border border-white/60 bg-white p-2.5 pb-8 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform duration-300 hover:scale-105"
              >
                <GalleryImage
                  className="h-full w-full rounded-2xl object-cover"
                  src={campusImages.hero[1]}
                  alt="Students learning together in modern classroom"
                />
                <span className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-school-navy">
                  Learning at SMDPVC
                </span>
              </motion.div>
            </div>

            <span
              className="absolute right-2 top-[4%] rounded-full border border-school-gold-light/60 bg-school-navy/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-school-gold-light shadow-xl backdrop-blur-md"
              style={{ transform: "translateZ(100px)" }}
            >
              Campus Life
            </span>
          </div>
        </motion.div>
      </div>

      {/* Main Content & Apple Headline Architecture */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 sm:px-10 lg:px-16 lg:pb-20">
        <div className="max-w-3xl">
          {/* Frosted Heritage Pill - Enters from left after 2-second cinematic pause */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: shouldReduceMotion ? 0 : 2.0,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-flex items-center gap-2.5 rounded-full border border-school-gold/40 bg-school-navy/60 px-4 py-1.5 text-xs font-semibold text-school-gold-light backdrop-blur-md shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-school-gold animate-pulse" />
            <span className="uppercase tracking-[0.16em] text-[11px]">
              {currentSlide.badge}
            </span>
          </motion.div>

          {/* High-impact Serif Headline & Description - Enters from left starting at 2.15s */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pageTitle ?? "home"}-${activeSlide}`}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: 16 }}
              transition={{
                duration: 0.6,
                delay: shouldReduceMotion ? 0 : activeSlide === 0 ? 2.15 : 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <h1 className="mt-4 font-serif text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {currentSlide.title}
              </h1>

              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.55,
                  delay: shouldReduceMotion ? 0 : activeSlide === 0 ? 2.35 : 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-5 max-w-2xl text-base font-normal leading-relaxed text-white/80 sm:text-lg"
              >
                {currentSlide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Dual Action Buttons - Staggers in after description (approx 2.55s) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: shouldReduceMotion ? 0 : 2.55,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => scrollToSection(pageHero?.firstSectionId ?? "enquiry")}
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-school-gold-light via-school-gold to-school-gold-hover px-7 py-3.5 text-sm font-bold text-school-navy shadow-[0_10px_25px_rgba(197,160,70,0.35)] transition-shadow hover:shadow-[0_14px_30px_rgba(197,160,70,0.45)]"
            >
              {pageHero ? `Explore ${pageTitle}` : "Make an Enquiry"}
              <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>

            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => scrollToSection(pageHero?.firstSectionId ?? "foundation")}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 hover:border-white/40"
            >
              {pageHero ? "About This Section" : "Our Foundation"}
            </motion.button>
          </motion.div>
        </div>

        {/* Carousel Slide Indicators */}
        <div className="mt-12 flex items-center gap-2.5">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              aria-label={`Slide ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === activeSlide
                  ? "w-10 bg-school-gold shadow-md"
                  : "w-2.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
