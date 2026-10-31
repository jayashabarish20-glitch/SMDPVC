import { useState, type FormEvent } from "react";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function Admissions() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [status, setStatus] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(
      "Your details are valid, but this website has no enquiry backend. Your message has not been sent or stored.",
    );
    e.currentTarget.reset();
  };

  return (
    <section id="enquiry" className="relative scroll-mt-20 bg-school-cream py-24 lg:py-36 overflow-hidden">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Enquiry
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Get in Touch
          </h2>
          <p className="mt-4 text-base leading-relaxed text-school-muted">
            Send a question to the school. Required fields are validated in your browser.
          </p>
        </div>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,23,54,0.08)] border border-school-navy/10">
          <div className="bg-school-navy p-8 text-white sm:px-10">
            <span className="rounded-full bg-school-gold/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-school-gold-light">
              School Enquiry
            </span>
            <h3 className="mt-3 font-serif text-2xl sm:text-3xl font-bold">
              How Can We Help?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              Complete the form below. It is not connected to a submission service.
            </p>
          </div>

          <form
            className="space-y-6 p-8 sm:p-10"
            onSubmit={handleSubmit}
            onInvalid={() => setStatus("Please check the required fields and correct any invalid entries.")}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="enquiry-name" className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Student / Parent Name *
                </label>
                <input
                  className="form-field"
                  id="enquiry-name"
                  type="text"
                  name="name"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  onChange={() => setStatus("")}
                />
              </div>

              <div>
                <label htmlFor="enquiry-contact" className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Contact Number *
                </label>
                <input
                  className="form-field"
                  id="enquiry-contact"
                  type="tel"
                  name="contact"
                  placeholder="Phone number"
                  autoComplete="tel"
                  pattern="[+]?[0-9\s().-]{7,20}"
                  title="Enter a valid phone number using 7 to 20 digits, spaces, or + ( ) . - characters."
                  required
                  onChange={() => setStatus("")}
                />
              </div>

              <div>
                <label htmlFor="enquiry-email" className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Email Address
                </label>
                <input
                  className="form-field"
                  id="enquiry-email"
                  type="email"
                  name="email"
                  placeholder="parent@email.com"
                  autoComplete="email"
                  onChange={() => setStatus("")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="enquiry-message" className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                Enquiry Message *
              </label>
              <textarea
                className="form-field min-h-28 resize-y"
                id="enquiry-message"
                name="message"
                placeholder="How can the school help?"
                required
                onChange={() => setStatus("")}
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-school-gold-light via-school-gold to-school-gold-hover py-4 text-sm font-bold text-school-navy shadow-[0_10px_25px_rgba(197,160,70,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-98"
            >
              Submit Enquiry
              <Icon name="arrow" className="h-4 w-4" />
            </button>

            {status && (
              <div
                role="status"
                className="rounded-2xl border border-school-gold/30 bg-school-cream-alt p-4 text-center text-xs font-medium text-school-navy sm:text-sm"
              >
                {status}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
