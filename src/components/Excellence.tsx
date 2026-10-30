import { useState } from "react";
import { campusImages, centumScores, sportsAchievements, toppers10 } from "../data";
import { useInView } from "../hooks/useInView";
import { Icon } from "./Icon";

type AchievementsTab = "academic" | "sports";
type ClassTab = "12" | "10";

export function Excellence() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [tab, setTab] = useState<AchievementsTab>("academic");
  const [classTab, setClassTab] = useState<ClassTab>("12");

  const toppers = classTab === "12" ? campusImages.toppers12 : toppers10;

  return (
    <section id="excellence" className="relative scroll-mt-20 bg-school-cream py-24 lg:py-36 overflow-hidden">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-16 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Hall of Fame &amp; Accolades
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-school-navy sm:text-4xl lg:text-5xl">
            Celebrating Excellence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-school-muted">
            Recognizing the diligence, discipline, and extraordinary accomplishments
            of our students in academics and competitive sports.
          </p>
        </div>

        {/* Primary Tab Switcher (Academic vs Sports) */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full bg-white p-1.5 shadow-sm border border-school-navy/10">
            <button
              type="button"
              onClick={() => setTab("academic")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 ${
                tab === "academic"
                  ? "bg-school-navy text-white shadow-md"
                  : "text-school-muted hover:text-school-navy"
              }`}
            >
              <Icon name="graduation" className="h-4 w-4" />
              Academic Merit
            </button>
            <button
              type="button"
              onClick={() => setTab("sports")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 ${
                tab === "sports"
                  ? "bg-school-navy text-white shadow-md"
                  : "text-school-muted hover:text-school-navy"
              }`}
            >
              <Icon name="trophy" className="h-4 w-4" />
              Sports &amp; Athletics
            </button>
          </div>
        </div>

        {/* Academic Content */}
        {tab === "academic" ? (
          <div>
            {/* Secondary Switcher: Class 12 vs Class 10 */}
            <div className="flex justify-center gap-3 mb-12">
              {(["12", "10"] as const).map((grade) => (
                <button
                  key={grade}
                  onClick={() => setClassTab(grade)}
                  className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                    classTab === grade
                      ? "border-school-gold bg-school-gold/15 text-school-navy shadow-sm"
                      : "border-school-navy/15 bg-white text-school-muted hover:border-school-gold"
                  }`}
                >
                  Class {grade} Board Toppers
                </button>
              ))}
            </div>

            {/* Toppers Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {toppers.map((student, index) => (
                <div
                  key={student.name}
                  className={`relative rounded-3xl bg-white p-8 text-center shadow-[0_10px_35px_rgba(11,23,54,0.04)] border border-school-navy/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    index === 0 ? "ring-2 ring-school-gold" : ""
                  }`}
                >
                  {index === 0 && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-school-gold-light to-school-gold px-4 py-1 text-[10px] font-extrabold uppercase tracking-widest text-school-navy shadow-md">
                      ★ School Rank 1
                    </span>
                  )}
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-school-cream shadow-inner">
                    <img
                      src={student.image}
                      alt={student.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold text-school-navy">
                    {student.name}
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-school-gold-hover">
                    {student.score}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-school-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-school-muted">
                    {student.stream}
                  </span>
                </div>
              ))}
            </div>

            {/* Centum Scorers Banner */}
            <div className="mt-14 rounded-3xl bg-school-navy p-8 lg:p-10 text-white shadow-xl">
              <div className="text-center max-w-xl mx-auto">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-school-gold">
                  HSC Examinations 2025
                </span>
                <h3 className="mt-2 font-serif text-2xl font-bold">
                  Subject-wise 100/100 Centum Scorers
                </h3>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {centumScores.map((item) => (
                  <div
                    key={item.subject}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-center transition-all duration-200 hover:bg-white/[0.1]"
                  >
                    <p className="font-serif text-3xl lg:text-4xl font-extrabold text-school-gold-light">
                      {item.count}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-white/80">
                      {item.subject}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Sports & Athletics Content */
          <div className="grid items-stretch gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {sportsAchievements.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm border border-school-navy/6 transition-all duration-200 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-school-gold/15 text-school-gold">
                    <Icon name="trophy" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-school-navy">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-school-muted">{item.sport}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="rounded-full bg-school-navy/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-school-gold-hover">
                        {item.level}
                      </span>
                      <span className="text-[11px] font-medium text-school-muted-light">
                        {item.year}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sports Showcase Card */}
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-school-navy shadow-lg">
              <img
                src={campusImages.sports}
                alt="Athletics champions"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-school-navy via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="rounded-full bg-school-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-school-navy">
                  State Honors
                </span>
                <h4 className="mt-2 font-serif text-xl font-bold">
                  Nurturing Athletic Champions
                </h4>
                <p className="mt-1 text-xs text-white/80">
                  Comprehensive training in Track &amp; Field, Kabaddi, Volleyball, and Chess.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

