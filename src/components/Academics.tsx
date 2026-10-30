import { streams } from "../data";
import { useInView } from "../hooks/useInView";
import { Icon, scrollToSection } from "./Icon";

export function Academics() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="academics" className="relative scroll-mt-20 bg-school-navy py-24 lg:py-36 text-white overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] bg-school-navy-light/40 blur-[140px] pointer-events-none" />

      <div
        ref={ref}
        className={`relative z-10 mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Higher Secondary Curriculum
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Academic Programmes &amp; Streams
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Tamil Nadu State Board (HSC) affiliated groups specifically designed for intellectual depth,
            competitive entrance preparedness, and professional career readiness.
          </p>
        </div>

        {/* 4 Interactive Stream Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {streams.map((stream) => (
            <div
              key={stream.group}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08] hover:border-school-gold/50 hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:-translate-y-1.5"
            >
              <div>
                {/* Icon & Group Badge */}
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-school-gold transition-colors duration-300 group-hover:bg-school-gold group-hover:text-school-navy">
                    <Icon name={stream.icon} className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-school-gold/30 bg-school-navy/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-school-gold-light">
                    {stream.group}
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-2xl font-bold tracking-tight text-white group-hover:text-school-gold-light transition-colors">
                  {stream.title}
                </h3>

                {/* Subject Pills */}
                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">
                    Curriculum Subjects
                  </p>
                  <ul className="space-y-2.5">
                    {stream.subjects.map((subject) => (
                      <li key={subject} className="flex items-center gap-2.5 text-sm text-white/85">
                        <span className="h-1.5 w-1.5 rounded-full bg-school-gold" />
                        <span>{subject}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer: Medium & Action */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-white/60">
                  {stream.medium}
                </span>
                <button
                  onClick={() => scrollToSection("admissions")}
                  className="mt-3.5 flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-school-gold transition-all duration-200 hover:bg-school-gold hover:text-school-navy"
                >
                  <span>Admission Enquiry</span>
                  <Icon name="arrow" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

