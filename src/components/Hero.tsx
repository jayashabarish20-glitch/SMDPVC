import { useEffect, useState, type PointerEvent } from "react";
import { campusImages, heroSlides } from "../data";
import type { SchoolPageConfig } from "../schoolPageData";
import { Icon, scrollToSection } from "./Icon";

type HeroProps = {
  pageHero?: SchoolPageConfig["hero"];
  pageTitle?: string;
};

export function Hero({ pageHero, pageTitle }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [galleryTilt, setGalleryTilt] = useState({ x: 0, y: 0 });
  const slides = pageHero?.slides ?? heroSlides;
  const images = pageHero?.images ?? campusImages.hero;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, pageHero ? 4500 : 6000);
    return () => clearInterval(timer);
  }, [isPaused, pageHero, slides.length]);

  useEffect(() => {
    setActiveSlide(0);
    setIsPaused(false);
  }, [pageHero]);

  useEffect(() => {
    images.forEach((image) => {
      const preloadedImage = new Image();
      preloadedImage.src = image;
    });
  }, [images]);

  const updateGalleryTilt = (e: PointerEvent<HTMLDivElement>) => {
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
      className="relative flex min-h-[640px] h-[100svh] flex-col justify-end overflow-hidden pt-20"
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
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `rotateX(${galleryTilt.x}deg) rotateY(${galleryTilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Card 1: Sports & Extracurricular */}
          <div
            className="absolute left-[20%] top-[60%] h-[54%] w-[45%] overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-2 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105"
            style={{
              transform: "translate(-50%, -50%) rotateY(20deg) rotateZ(-6deg) translateZ(-40px)",
            }}
          >
            <img
              className="h-full w-full rounded-xl object-cover"
              src={campusImages.sports}
              alt="Students taking part in school sports"
              loading="lazy"
            />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-school-navy">
              Campus Activities
            </span>
          </div>

          {/* Card 2: Leadership & Community */}
          <div
            className="absolute left-[82%] top-[34%] h-[48%] w-[40%] overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-2 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105"
            style={{
              transform: "translate(-50%, -50%) rotateY(-18deg) rotateZ(6deg) translateZ(-15px)",
            }}
          >
            <img
              className="h-full w-full rounded-xl object-cover object-top"
              src={campusImages.principal}
              alt="School leadership"
              loading="lazy"
            />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-school-navy">
              School Community
            </span>
          </div>

          {/* Card 3: Main Classroom & Lab Focus */}
          <div
            className="absolute left-[50%] top-[50%] h-[72%] w-[62%] overflow-hidden rounded-3xl border border-white/60 bg-white p-2.5 pb-8 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 hover:scale-105"
            style={{
              transform: "translate(-50%, -50%) rotateY(-6deg) rotateX(4deg) translateZ(60px)",
            }}
          >
            <img
              className="h-full w-full rounded-2xl object-cover"
              src={campusImages.hero[1]}
              alt="Students learning together in modern classroom"
              fetchPriority="low"
            />
            <span className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-school-navy">
              Learning at SMDPVC
            </span>
          </div>

          <span
            className="absolute right-2 top-[4%] rounded-full border border-school-gold-light/60 bg-school-navy/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-school-gold-light shadow-xl backdrop-blur-md"
            style={{ transform: "translateZ(100px)" }}
          >
            Campus Life
          </span>
        </div>
      </div>

      {/* Main Content & Apple Headline Architecture */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 sm:px-10 lg:px-16 lg:pb-20">
        <div className="max-w-3xl">
          {/* Frosted Heritage Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-school-gold/40 bg-school-navy/60 px-4 py-1.5 text-xs font-semibold text-school-gold-light backdrop-blur-md shadow-sm">
            <span className="h-2 w-2 rounded-full bg-school-gold animate-pulse" />
            <span className="uppercase tracking-[0.16em] text-[11px]">
              {currentSlide.badge}
            </span>
          </div>

          {/* High-impact Serif Headline */}
          <div
            key={`${pageTitle ?? "home"}-${activeSlide}`}
            className={pageHero ? "school-hero-copy-enter" : ""}
          >
            <h1 className="mt-4 font-serif text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {currentSlide.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base font-normal leading-relaxed text-white/80 sm:text-lg">
              {currentSlide.description}
            </p>
          </div>

          {/* Dual Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => scrollToSection(pageHero?.firstSectionId ?? "enquiry")}
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-school-gold-light via-school-gold to-school-gold-hover px-7 py-3.5 text-sm font-bold text-school-navy shadow-[0_10px_25px_rgba(197,160,70,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-98"
            >
              {pageHero ? `Explore ${pageTitle}` : "Make an Enquiry"}
              <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => scrollToSection(pageHero?.firstSectionId ?? "foundation")}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-white/40 active:scale-98"
            >
              {pageHero ? "About This Section" : "Our Foundation"}
            </button>

            {/* Play/Pause Toggle */}
            <button
              type="button"
              aria-label={isPaused ? "Play slide rotation" : "Pause slide rotation"}
              onClick={() => setIsPaused(!isPaused)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:text-white"
            >
              <Icon name={isPaused ? "play" : "pause"} className="h-4 w-4" />
            </button>
          </div>
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
