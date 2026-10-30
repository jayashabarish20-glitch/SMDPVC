import { useState, type FormEvent } from "react";
import { admissionSteps } from "../data";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function Admissions() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    e.currentTarget.reset();
  };

  return (
    <section id="admissions" className="relative scroll-mt-20 bg-school-cream py-24 lg:py-36 overflow-hidden">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Academic Year 2026–2027
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Begin Your Educational Journey
          </h2>
          <p className="mt-4 text-base leading-relaxed text-school-muted">
            Join a legacy that values integrity, intellectual rigour, and holistic personal growth.
          </p>
        </div>

        {/* 3 Step Process Architecture */}
        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {admissionSteps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-3xl bg-white p-8 shadow-[0_10px_35px_rgba(11,23,54,0.04)] border border-school-navy/8 transition-all duration-300 hover:border-school-gold/40 hover:-translate-y-1"
            >
              <span className="font-serif text-5xl font-extrabold text-school-gold/60">
                {step.number}
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-school-navy">
                {step.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-school-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Apple-style Glassmorphic Admission Request Form */}
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,23,54,0.08)] border border-school-navy/10">
          <div className="bg-school-navy p-8 text-white sm:px-10">
            <span className="rounded-full bg-school-gold/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-school-gold-light">
              Admission Registration
            </span>
            <h3 className="mt-3 font-serif text-2xl sm:text-3xl font-bold">
              Request a Prospectus or Advisory Callback
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              Submit your enquiry below and our admissions team will connect with you.
            </p>
          </div>

          <form className="p-8 sm:p-10 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Student Name *
                </label>
                <input
                  className="form-field"
                  type="text"
                  name="studentName"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  onChange={() => setSubmitted(false)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Class Applying For *
                </label>
                <select
                  className="form-field"
                  name="classApplyingFor"
                  defaultValue=""
                  required
                  onChange={() => setSubmitted(false)}
                >
                  <option value="" disabled>Select class stream</option>
                  <option>Class XI – Pure Science (Group I)</option>
                  <option>Class XI – Bio Science (Group II)</option>
                  <option>Class XI – Commerce &amp; CS (Group III)</option>
                  <option>Class XI – Commerce &amp; Econ (Group IV)</option>
                  <option>Class VI – VIII (Foundation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Parent Phone Contact *
                </label>
                <input
                  className="form-field"
                  type="tel"
                  name="parentContact"
                  placeholder="+91 98421 XXXXX"
                  autoComplete="tel"
                  required
                  onChange={() => setSubmitted(false)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                  Email Address
                </label>
                <input
                  className="form-field"
                  type="email"
                  name="email"
                  placeholder="parent@email.com"
                  autoComplete="email"
                  onChange={() => setSubmitted(false)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                Preferred Instruction Medium
              </label>
              <select
                className="form-field"
                name="medium"
                defaultValue=""
                onChange={() => setSubmitted(false)}
              >
                <option value="">Select medium preference</option>
                <option>English Medium</option>
                <option>Tamil Medium</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-school-navy mb-2">
                Specific Inquiries or Requirements
              </label>
              <textarea
                className="form-field min-h-28 resize-y"
                name="message"
                placeholder="Mention any questions regarding syllabus, hostel, or transport..."
                onChange={() => setSubmitted(false)}
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-school-gold-light via-school-gold to-school-gold-hover py-4 text-sm font-bold text-school-navy shadow-[0_10px_25px_rgba(197,160,70,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-98"
            >
              Submit Prospectus Request
              <Icon name="arrow" className="h-4 w-4" />
            </button>

            {submitted && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs sm:text-sm font-medium text-emerald-800 animate-in fade-in duration-300">
                ✓ Thank you. Your prospectus request has been recorded for review.
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

