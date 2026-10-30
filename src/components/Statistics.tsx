import { AnimatedNumber, useInView } from "../hooks/useInView";

export function Statistics() {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  const stats = [
    { value: "147+", label: "Centum Scores", sub: "Recorded in HSC Examinations" },
    { value: "68 Yrs", label: "Years of Legacy", sub: "Shaping leaders since 1957" },
    { value: "2,400+", label: "University Placements", sub: "Premier institutions across India" },
    { value: "98%", label: "Consistent Pass Rate", sub: "Academic excellence standard" },
  ];

  return (
    <section className="relative z-20 border-y border-white/10 bg-school-deep text-white shadow-xl">
      <div
        ref={ref}
        className={`mx-auto grid max-w-7xl grid-cols-2 px-6 py-10 transition-all duration-1000 lg:grid-cols-4 lg:px-16 lg:py-14 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-4 py-4 text-center sm:px-8 ${
              index > 0 ? "border-l border-white/10" : ""
            }`}
          >
            <p className="font-serif text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-school-gold-light to-school-gold sm:text-4xl lg:text-5xl">
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="mt-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/90 sm:text-sm">
              {stat.label}
            </p>
            <p className="mt-1 hidden text-[11px] text-white/50 sm:block">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

