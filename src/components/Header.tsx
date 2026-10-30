import { useEffect, useState } from "react";
import { navItems } from "../data";
import { Icon, scrollToSection } from "./Icon";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      
      // Determine active section for subtle indicator
      const sections = navItems.map((item) => document.getElementById(item.id));
      const scrollPos = window.scrollY + 180;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveItem(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigate = (id: string) => {
    setMenuOpen(false);
    setActiveItem(id);
    scrollToSection(id);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3.5 transition-all duration-300 pointer-events-none">
        <div
          className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-500 ease-out sm:px-7 ${
            scrolled
              ? "bg-white/85 text-school-navy shadow-[0_12px_32px_rgba(11,23,54,0.08)] backdrop-blur-xl border border-school-navy/10 ring-1 ring-black/5"
              : "bg-school-navy/40 text-white shadow-lg backdrop-blur-md border border-white/15"
          }`}
        >
          {/* Logo Branding */}
          <a
            href="#home"
            className="flex shrink-0 items-center gap-3 group"
            aria-label="Saraswathi Vidyalaya home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-school-gold-light to-school-gold font-serif text-base font-bold text-school-navy shadow-sm transition-transform duration-300 group-hover:scale-105">
              S
            </span>
            <div className="leading-tight text-left">
              <span
                className={`block text-xs sm:text-sm font-bold tracking-tight transition-colors ${
                  scrolled ? "text-school-navy" : "text-white"
                }`}
              >
                Saraswathi Vidyalaya
              </span>
              <span className="block text-[9px] uppercase tracking-[0.18em] font-medium text-school-gold">
                Higher Secondary School
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 rounded-full ${
                    scrolled
                      ? isActive
                        ? "text-school-navy bg-school-navy/5 font-bold"
                        : "text-school-muted hover:text-school-navy hover:bg-black/5"
                      : isActive
                      ? "text-white bg-white/15 font-bold"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full ${
                        scrolled ? "bg-school-gold" : "bg-school-gold-light"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* CTA Action & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("admissions")}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 active:scale-95 ${
                scrolled
                  ? "bg-school-navy text-white hover:bg-school-navy-light shadow-sm"
                  : "bg-school-gold text-school-navy hover:bg-school-gold-light shadow-md"
              }`}
            >
              Admissions
              <Icon name="arrow" className="h-3 w-3" />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors md:hidden ${
                scrolled ? "text-school-navy hover:bg-black/5" : "text-white hover:bg-white/10"
              }`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-school-navy/95 px-6 pt-24 pb-8 text-white backdrop-blur-2xl transition-all md:hidden animate-in fade-in duration-300">
          <div className="flex flex-col space-y-2">
            {navItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{ animationDelay: `${index * 40}ms` }}
                className="flex items-center justify-between border-b border-white/10 py-3.5 text-left text-base font-semibold tracking-wide text-white/90 hover:text-school-gold"
              >
                <span>{item.label}</span>
                <Icon name="arrow" className="h-4 w-4 opacity-50" />
              </button>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={() => navigate("admissions")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-school-gold-light to-school-gold py-3.5 text-sm font-bold text-school-navy shadow-lg"
            >
              Apply for Admissions 2026–27
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

