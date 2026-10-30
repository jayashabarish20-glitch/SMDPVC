import { campusImages } from "../data";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function Contact() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const mapUrl =
    "https://www.google.com/maps/search/?api=1&query=No.+47%2C+Rajaji+Salai%2C+Kumbakonam+612001";

  return (
    <section id="contact" className="relative scroll-mt-20 bg-school-navy py-24 lg:py-36 text-white overflow-hidden">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Campus Admissions &amp; Inquiries
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Connect With Our Campus
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            We welcome parents, prospective students, and alumni to visit our campus in Kumbakonam.
          </p>
        </div>

        {/* 3 Contact Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Address */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08] hover:border-school-gold/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-school-gold">
              <Icon name="pin" className="h-6 w-6" />
            </span>
            <h3 className="mt-6 font-serif text-xl font-bold text-white">Campus Location</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              No. 47, Rajaji Salai,<br />
              Kumbakonam – 612 001,<br />
              Tamil Nadu, India
            </p>
          </div>

          {/* Telephone */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08] hover:border-school-gold/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-school-gold">
              <Icon name="phone" className="h-6 w-6" />
            </span>
            <h3 className="mt-6 font-serif text-xl font-bold text-white">Direct Lines</h3>
            <div className="mt-3 space-y-1.5 text-sm text-white/70">
              <a className="block transition-colors hover:text-school-gold" href="tel:+914352421000">
                +91 435 242 1000
              </a>
              <a className="block transition-colors hover:text-school-gold" href="tel:+914352421001">
                +91 435 242 1001
              </a>
              <a className="block font-semibold text-school-gold transition-colors hover:text-white" href="tel:+919842100000">
                Admissions: +91 98421 00000
              </a>
            </div>
          </div>

          {/* Electronic Mail */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08] hover:border-school-gold/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-school-gold">
              <Icon name="mail" className="h-6 w-6" />
            </span>
            <h3 className="mt-6 font-serif text-xl font-bold text-white">Official Correspondence</h3>
            <div className="mt-3 space-y-1.5 text-sm text-white/70 break-all">
              <a className="block transition-colors hover:text-school-gold" href="mailto:principal@saraswathividyalaya.edu.in">
                principal@saraswathividyalaya.edu.in
              </a>
              <a className="block transition-colors hover:text-school-gold" href="mailto:admissions@saraswathividyalaya.edu.in">
                admissions@saraswathividyalaya.edu.in
              </a>
              <a className="block transition-colors hover:text-school-gold" href="mailto:info@saraswathividyalaya.edu.in">
                info@saraswathividyalaya.edu.in
              </a>
            </div>
          </div>
        </div>

        {/* Map Experience Card */}
        <div className="relative mt-10 h-72 sm:h-96 overflow-hidden rounded-3xl border border-white/15 bg-school-deep shadow-2xl">
          <img
            src={campusImages.location}
            alt="City view near the Saraswathi Vidyalaya campus"
            className="h-full w-full object-cover opacity-50 transition-transform duration-700 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-school-deep via-school-deep/40 to-transparent" />
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 text-center">
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-school-gold-light to-school-gold px-7 py-3.5 text-xs sm:text-sm font-bold text-school-navy shadow-[0_10px_25px_rgba(197,160,70,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Icon name="pin" className="h-4 w-4" />
              Open Campus Location on Google Maps
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

