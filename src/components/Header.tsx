import { useEffect, useMemo, useState } from "react";
import { navItems } from "../data";
import type { schoolBrandingByRoute } from "../homepageContent";
import type { SchoolPageConfig } from "../schoolPageData";
import { Icon } from "./Icon";

type HeaderProps = {
  page?: SchoolPageConfig;
  branding: (typeof schoolBrandingByRoute)[keyof typeof schoolBrandingByRoute];
};

export function Header({ page, branding }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(page?.sections[0]?.id ?? "home");
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

  const closeMenu = () => setMenuOpen(false);
  const navClass = page
    ? useSchoolMenu
      ? "hidden"
      : "hidden xl:flex"
    : "hidden md:flex";
  const toggleClass = page
    ? useSchoolMenu
      ? "flex"
      : "flex xl:hidden"
    : "flex md:hidden";

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3.5">
        <div
          style={
            schoolMenuOpen
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
                    scrolled && !schoolMenuOpen ? "text-school-navy" : "text-white"
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
                <a
                  href="/"
                  className={`inline-flex rounded-full px-2 py-1.5 text-[9px] font-bold leading-tight transition-all duration-300 sm:px-3 sm:text-[10px] 2xl:px-4 2xl:text-xs ${
                    scrolled && !schoolMenuOpen
                      ? "bg-school-navy text-white hover:bg-school-navy-light"
                      : "bg-school-gold text-school-navy hover:bg-school-gold-light"
                  }`}
                >
                  Back to Home
                </a>
              ) : (
                <a
                  href="#enquiry"
                  className={`hidden rounded-full px-3 py-1.5 text-[10px] font-bold transition-all duration-300 sm:inline-flex 2xl:px-4 2xl:text-xs ${
                    scrolled
                      ? "bg-school-navy text-white hover:bg-school-navy-light"
                      : "bg-school-gold text-school-navy hover:bg-school-gold-light"
                  }`}
                >
                  Enquiry <Icon name="arrow" className="ml-1.5 h-3 w-3" />
                </a>
              )}
              <button
                type="button"
                className={`${toggleClass} h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  scrolled && !schoolMenuOpen ? "text-school-navy hover:bg-black/5" : "text-white hover:bg-white/10"
                }`}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {page && menuOpen && (
            <nav
              aria-label={`${page.title} section navigation`}
              className="grid max-h-[65vh] grid-cols-2 gap-2 overflow-y-auto border-t border-white/20 px-4 py-3 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"
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

      {!page && menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-school-navy/95 px-6 pb-8 pt-24 text-white backdrop-blur-2xl md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-white/10 py-3.5 text-left text-base font-semibold tracking-wide text-white/90 hover:text-school-gold"
              >
                <span>{item.label}</span>
                <Icon name="arrow" className="h-4 w-4 opacity-50" />
              </a>
            ))}
          </nav>
          <a
            href="#enquiry"
            onClick={closeMenu}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-school-gold-light to-school-gold py-3.5 text-sm font-bold text-school-navy shadow-lg"
          >
            Enquiry <Icon name="arrow" className="h-4 w-4" />
          </a>
        </div>
      )}
    </>
  );
}
