import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { navItems } from "../data";
import type { schoolBrandingByRoute } from "../homepageContent";
import type { SchoolPageConfig } from "../schoolPageData";
import { Icon, scrollToSection } from "./Icon";

type HeaderProps = {
  page?: SchoolPageConfig;
  branding: (typeof schoolBrandingByRoute)[keyof typeof schoolBrandingByRoute];
};

export function Header({ page, branding }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(page?.sections[0]?.id ?? "home");
  const shouldReduceMotion = useReducedMotion();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const items = useMemo(
    () =>
      page
        ? page.sections.map((section) => ({
            id: section.id,
            label: section.title,
            href: `#${section.id}`,
          }))
        : navItems.map((item) => ({
            ...item,
            href: item.id === "home" ? "/" : `#${item.id}`,
          })),
    [page],
  );
  const useSchoolMenu = Boolean(page && page.sections.length > 7);
  const schoolMenuOpen = Boolean(page && menuOpen);

  useEffect(() => {
    setActiveItem(items[0]?.id ?? "home");

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (active) setActiveItem(active.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    items.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  useEffect(() => {
    if (!menuOpen || !window.matchMedia("(max-width: 1023px)").matches) return;

    // Push state so mobile back button/gesture triggers an animated menu close
    window.history.pushState({ mobileMenu: true }, "");

    const handlePopState = () => {
      setMenuOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusableElements = () =>
      Array.from(
        mobileNavigationRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);

    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() =>
      firstMenuLinkRef.current?.focus(),
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = focusableElements();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && previousFocus !== document.body) {
        previousFocus.focus();
      } else {
        menuButtonRef.current?.focus();
      }
    };
  }, [menuOpen]);

  const closeMenu = () => {
    if (window.history.state?.mobileMenu) {
      window.history.back();
    }
    setMenuOpen(false);
  };

  const handleMobileNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    setMenuOpen(false);

    if (window.history.state?.mobileMenu) {
      window.history.back();
    }

    if (href.startsWith("#")) {
      event.preventDefault();
      const targetId = href.slice(1) || id;
      if (window.location.hash !== "#" + targetId) {
        window.history.replaceState(null, "", "#" + targetId);
      }
      setTimeout(() => {
        scrollToSection(targetId);
      }, 50);
    }
  };
  const navClass = page
    ? useSchoolMenu
      ? "hidden"
      : "hidden lg:flex"
    : "hidden lg:flex";
  const toggleClass = page
    ? useSchoolMenu
      ? "flex"
      : "flex lg:hidden"
    : "flex lg:hidden";

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3.5">
        <div
          style={
            menuOpen
              ? {
                  backgroundColor: "var(--color-school-navy)",
                  transitionDuration: "0ms",
                }
              : undefined
          }
          className={`pointer-events-auto flex w-full flex-col transition-all duration-500 ease-out ${
            page ? "max-w-7xl" : "max-w-5xl"
          } ${
            page && menuOpen ? "rounded-3xl" : "rounded-full"
          } ${
            schoolMenuOpen
              ? "max-h-[calc(100dvh-1.75rem)] overflow-y-auto border border-school-gold/30 bg-school-navy text-white shadow-2xl"
              : menuOpen
              ? "border border-school-gold/30 bg-school-navy text-white shadow-2xl"
              : scrolled
              ? "border border-school-navy/10 bg-white/85 text-school-navy shadow-[0_12px_32px_rgba(11,23,54,0.08)] ring-1 ring-black/5 backdrop-blur-xl"
              : "border border-white/15 bg-school-navy/40 text-white shadow-lg backdrop-blur-md"
          }`}
        >
          <div className="flex min-h-[56px] w-full items-center justify-between gap-2 rounded-full px-4 py-2.5 sm:px-7">
            <a
              href="/"
              className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
              aria-label={`${branding.fullName} home`}
              onClick={closeMenu}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-school-gold-light to-school-gold font-serif text-base font-bold text-school-navy shadow-sm transition-transform duration-300 group-hover:scale-105">
                S
              </span>
              <span className="leading-tight text-left">
                <span
                  className={`block text-xs font-bold tracking-tight sm:text-sm ${
                    scrolled && !menuOpen ? "text-school-navy" : "text-white"
                  }`}
                >
                  {branding.wordmark}
                </span>
                <span
                  aria-label={branding.fullName}
                  className="block whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.12em] text-school-gold sm:tracking-[0.18em]"
                >
                  {branding.subtitle}
                </span>
              </span>
            </a>

            <nav className={`${navClass} min-w-0 items-center justify-center gap-0.5`} aria-label="Main navigation">
              {items.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    className={`whitespace-nowrap rounded-full px-2 py-1.5 text-[10px] font-semibold leading-tight tracking-wide transition-all duration-200 2xl:px-2.5 2xl:text-[11px] ${
                      scrolled
                        ? isActive
                          ? "bg-school-navy/5 font-bold text-school-navy"
                          : "text-school-muted hover:bg-black/5 hover:text-school-navy"
                        : isActive
                          ? "bg-white/15 font-bold text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {page ? (
                <motion.a
                  href="/"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`inline-flex rounded-full px-2 py-1.5 text-[9px] font-bold leading-tight transition-colors sm:px-3 sm:text-[10px] 2xl:px-4 2xl:text-xs ${
                    scrolled && !schoolMenuOpen
                      ? "bg-school-navy text-white hover:bg-school-navy-light"
                      : "bg-school-gold text-school-navy hover:bg-school-gold-light"
                  }`}
                >
                  Back to Home
                </motion.a>
              ) : (
                <motion.a
                  href="#enquiry"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`hidden rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors sm:inline-flex 2xl:px-4 2xl:text-xs ${
                    scrolled
                      ? "bg-school-navy text-white hover:bg-school-navy-light"
                      : "bg-school-gold text-school-navy hover:bg-school-gold-light"
                  }`}
                >
                  Enquiry <Icon name="arrow" className="ml-1.5 h-3 w-3" />
                </motion.a>
              )}
              <motion.button
                ref={menuButtonRef}
                type="button"
                whileTap={{ scale: 0.92 }}
                className={`${toggleClass} h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  scrolled && !menuOpen ? "text-school-navy hover:bg-black/5" : "text-white hover:bg-white/10"
                }`}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls={menuOpen ? "mobile-navigation" : undefined}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span
                  aria-hidden="true"
                  className={`school-menu-icon ${menuOpen ? "is-open" : ""}`}
                >
                  <Icon name="menu" className="school-menu-icon-open h-5 w-5" />
                  <Icon name="close" className="school-menu-icon-close h-5 w-5" />
                </span>
              </motion.button>
            </div>
          </div>

          {page && useSchoolMenu && menuOpen && (
            <nav
              aria-label={`${page.title} section navigation`}
              className="hidden max-h-[65vh] grid-cols-2 gap-2 overflow-y-auto border-t border-white/20 px-4 py-3 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid"
            >
              {items.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    onClick={closeMenu}
                    className={`rounded-full px-3 py-2.5 text-xs font-semibold leading-tight transition-colors ${
                      isActive
                        ? "bg-school-gold text-school-navy"
                        : "text-white/95 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
              <a
                href="/"
                onClick={closeMenu}
                className="rounded-full px-3 py-2.5 text-xs font-bold leading-tight text-white hover:bg-white/10 hover:text-school-gold-light"
              >
                Back to Home
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Mobile navigation overlay + panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.15 : 0.45,
              delay: shouldReduceMotion ? 0 : 0.35, // Let items reverse stagger out first before overlay fades
              ease: "easeInOut",
            }}
            className="fixed inset-0 z-40 flex items-start justify-center bg-[rgba(5,11,26,0.76)] px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+5.5rem)] backdrop-blur-md lg:hidden"
            onClick={(event) => {
              if (event.target === event.currentTarget) closeMenu();
            }}
          >
            {/* Panel slides down on open, slides up on close */}
            <motion.div
              ref={mobileNavigationRef}
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-navigation-title"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -24 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.18 }
                  : {
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],           // smooth ease-out on open
                    }
              }
              style={{ originY: 0 }}
              className="flex max-h-full w-full max-w-xl flex-col overflow-y-auto rounded-[1.75rem] border border-school-gold/20 bg-school-deep/95 p-5 text-white shadow-2xl backdrop-blur-2xl sm:p-8"
            >
              {/* Branding header — fades in slightly after panel */}
              <motion.div
                className="mb-5 border-b border-white/10 pb-5"
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4, transition: { duration: 0.18 } }}
                transition={{
                  duration: 0.4,
                  delay: shouldReduceMotion ? 0 : 1.0,
                  ease: "easeOut",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-school-gold">
                  {branding.wordmark}
                </p>
                <h2
                  id="mobile-navigation-title"
                  className="mt-1 font-serif text-2xl font-semibold text-white"
                >
                  {branding.fullName}
                </h2>
                <p className="mt-1 text-xs text-white/60">{branding.subtitle}</p>
              </motion.div>

              {/* Nav links — staggered slide-in from left on open, reverse stagger on close */}
              <nav aria-label="Mobile navigation" className="flex flex-col">
                {items.map((item, index) => (
                  <motion.a
                    key={item.id}
                    ref={index === 0 ? firstMenuLinkRef : undefined}
                    href={item.href}
                    aria-current={activeItem === item.id ? "location" : undefined}
                    onClick={(e) => handleMobileNavClick(e, item.href, item.id)}
                    custom={index}
                    initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : {
                            opacity: 0,
                            x: -12,
                            transition: {
                              // Reverse stagger: last item exits first
                              delay: (items.length - 1 - index) * 0.05,
                              duration: 0.2,
                              ease: "easeIn",
                            },
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.15 }
                        : {
                            delay: shouldReduceMotion ? 0 : 1.08 + index * 0.065,
                            duration: 0.35,
                            ease: [0.25, 1, 0.5, 1],
                          }
                    }
                    whileTap={{ scale: 0.98 }}
                    className={`group flex min-h-14 items-center justify-between gap-4 border-b border-white/10 py-3 text-left text-base font-semibold tracking-wide transition-colors hover:text-school-gold-light ${
                      activeItem === item.id ? "text-school-gold-light" : "text-white/90"
                    }`}
                  >
                    <span>{item.label}</span>
                    <Icon
                      name="arrow"
                      className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100"
                    />
                  </motion.a>
                ))}
              </nav>

              {/* CTA button — enters last, exits first */}
              <motion.a
                href={page ? "/" : "#enquiry"}
                onClick={(e) => handleMobileNavClick(e, page ? "/" : "#enquiry", "enquiry")}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 6, transition: { duration: 0.16, ease: "easeIn" } }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0.15 }
                    : {
                        delay: shouldReduceMotion ? 0 : 1.08 + items.length * 0.065,
                        duration: 0.35,
                        ease: [0.25, 1, 0.5, 1],
                      }
                }
                whileTap={{ scale: 0.98 }}
                className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-school-gold px-6 py-3 text-sm font-bold text-school-navy shadow-lg transition-colors hover:bg-school-gold-light"
              >
                {page ? "Back to Home" : "Make an Enquiry"}
                <Icon name="arrow" className="h-4 w-4" />
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
