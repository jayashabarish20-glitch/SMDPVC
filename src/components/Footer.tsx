import { accreditation, navItems } from "../data";
import { Icon, scrollToSection } from "./Icon";

export function Footer() {
  return (
    <footer className="relative bg-school-deep text-white border-t border-white/10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Identity & Affiliation */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-school-gold-light to-school-gold font-serif text-lg font-bold text-school-navy shadow-sm">
                S
              </span>
              <div>
                <p className="font-serif text-base font-bold text-white">Saraswathi Vidyalaya</p>
                <p className="text-[10px] uppercase tracking-widest text-school-gold">Higher Secondary</p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-white/55">
              Affiliated to Tamil Nadu State Board of Secondary Education.
              <br />
              Registration No. TN/HSS/2024/04871
            </p>
            <p className="mt-3 text-xs text-white/40">
              Kumbakonam, Tamil Nadu, India.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              Navigation
            </h4>
            <div className="mt-4 flex flex-col space-y-2.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left text-xs font-medium text-white/60 transition-colors hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Accreditations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              Accreditations &amp; Quality
            </h4>
            <ul className="mt-4 space-y-3">
              {accreditation.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs text-white/60">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-school-gold/20 text-school-gold mt-0.5">
                    <Icon name="check" className="h-2.5 w-2.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Campus Office */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              Admissions Office
            </h4>
            <address className="mt-4 space-y-2 text-xs not-italic leading-relaxed text-white/60">
              <p>No. 47, Rajaji Salai</p>
              <p>Kumbakonam – 612 001, Tamil Nadu</p>
              <p className="pt-2">
                <a className="transition-colors hover:text-school-gold" href="tel:+914352421000">
                  +91 435 242 1000
                </a>
              </p>
              <p>
                <a className="transition-colors hover:text-school-gold" href="mailto:info@saraswathividyalaya.edu.in">
                  info@saraswathividyalaya.edu.in
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 Saraswathi Vidyalaya Higher Secondary School. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for educational excellence · Built with precision
          </p>
        </div>
      </div>
    </footer>
  );
}

