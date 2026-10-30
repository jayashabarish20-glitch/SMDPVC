import { campusImages } from "../data";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

export function About() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="about" className="relative scroll-mt-20 bg-school-cream py-24 lg:py-36 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-40 h-96 w-96 rounded-full bg-school-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 h-96 w-96 rounded-full bg-school-navy/5 blur-3xl pointer-events-none" />

      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Our Foundation &amp; Ethos
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Rooted in Tradition, Driven by Excellence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-school-muted">
            For nearly seven decades, Saraswathi Vidyalaya has provided an environment
            where intellectual curiosity flourishes alongside enduring cultural values.
          </p>
        </div>

        {/* Bento Grid Layout (Apple-inspired asymmetric composition) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Card 1: Principal's Desk & Vision Statement (Spans 7 cols on large screens) */}
          <div className="rounded-3xl bg-white p-8 lg:p-10 shadow-[0_10px_35px_rgba(11,23,54,0.04)] border border-school-navy/8 lg:col-span-7 flex flex-col justify-between group hover:border-school-gold/40 transition-all duration-300">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-school-navy/5 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-school-navy">
                <Icon name="sparkles" className="h-3.5 w-3.5 text-school-gold" />
                Principal&apos;s Perspective
              </div>
              <h3 className="mt-6 font-serif text-2xl sm:text-3xl font-bold leading-snug text-school-navy">
                &ldquo;Excellence is not an isolated act, but an enduring habit cultivated every single day.&rdquo;
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-school-muted sm:text-base">
                Welcome to Saraswathi Vidyalaya. An institution where intellectual rigour,
                compassion, and character build the foundation for tomorrow. Every student possesses
                unique talent, and our mission is to discover and ignite that potential.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-school-navy/10 flex items-center gap-4">
              <img
                src={campusImages.principal}
                alt="Dr. Meenakshi Sundaram"
                className="h-14 w-14 rounded-full object-cover object-top ring-2 ring-school-gold"
                loading="lazy"
              />
              <div>
                <h4 className="text-base font-bold text-school-navy">
                  Dr. Meenakshi Sundaram, M.Phil., Ph.D.
                </h4>
                <p className="text-xs font-medium text-school-gold-hover">
                  Principal &amp; Chief Academic Officer
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 & 3: Vision & Mission (Spans 5 cols) */}
          <div className="lg:col-span-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {/* Vision */}
            <div className="rounded-3xl bg-white p-7 lg:p-8 shadow-[0_10px_35px_rgba(11,23,54,0.04)] border border-school-navy/8 group hover:border-school-gold/40 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-school-gold/15 text-school-gold">
                <Icon name="target" className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-school-navy">
                Our Vision
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-school-muted">
                To be a premier seat of learning, inspiring students to lead with wisdom,
                integrity, and intellectual courage in an interconnected world.
              </p>
            </div>

            {/* Mission */}
            <div className="rounded-3xl bg-white p-7 lg:p-8 shadow-[0_10px_35px_rgba(11,23,54,0.04)] border border-school-navy/8 group hover:border-school-gold/40 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-school-navy/10 text-school-navy">
                <Icon name="leaf" className="h-6 w-6 text-school-navy" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-school-navy">
                Our Mission
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-school-muted">
                Providing student-centred education that nurtures analytical strength,
                artistic expression, ethical values, and athletic perseverance.
              </p>
            </div>
          </div>
        </div>

        {/* Board of Trustees Section */}
        <div className="mt-16 lg:mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-school-navy/10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-school-gold">
                Leadership
              </p>
              <h3 className="font-serif text-2xl font-bold text-school-navy">
                Board of Trustees
              </h3>
            </div>
            <p className="mt-1 sm:mt-0 text-xs text-school-muted">
              Guiding Saraswathi Vidyalaya with decades of educational devotion
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {campusImages.trustees.map((person) => (
              <div
                key={person.name}
                className="group rounded-2xl bg-white p-5 text-center shadow-sm border border-school-navy/6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-school-gold/30"
              >
                <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full ring-2 ring-school-cream group-hover:ring-school-gold transition-all duration-300">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h4 className="mt-4 text-sm font-bold text-school-navy">
                  {person.name}
                </h4>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-school-gold">
                  {person.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

