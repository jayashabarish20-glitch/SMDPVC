import { navItems } from "../data";
import { Icon } from "./Icon";

const schoolLinks = [
  { label: "Nursery", href: "/nursery" },
  { label: "Primary", href: "/primary" },
  { label: "Higher Secondary", href: "/higher-secondary" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-school-deep text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-school-gold-light to-school-gold font-serif text-lg font-bold text-school-navy shadow-sm">
                S
              </span>
              <div>
                <p className="font-serif text-base font-bold text-white">SMDPVC</p>
                <p className="text-[10px] uppercase tracking-widest text-school-gold">
                  Higher Secondary School
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-xs leading-relaxed text-white/55">
              School information and contact details can be added here after
              confirmation by the school.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              Home
            </h4>
            <div className="mt-4 flex flex-col space-y-2.5">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.id === "home" ? "/" : `/#${item.id}`}
                  className="text-xs font-medium text-white/60 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              School Sections
            </h4>
            <div className="mt-4 flex flex-col space-y-2.5">
              {schoolLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-xs font-medium text-white/60 transition-colors hover:text-white"
                >
                  {link.label} <Icon name="arrow" className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} SMDPVC.</p>
          <a href="/" className="transition-colors hover:text-white">
            Back to Home
          </a>
        </div>
      </div>
    </footer>
  );
}
