import { useState } from "react";
import { campusImages, centumScores, sportsAchievements } from "../data";
import { useInView } from "../hooks/useInView";
import { useToppers } from "../hooks/useToppers";
import { useAchievements } from "../hooks/useAchievements";
import { Icon } from "./Icon";
import { ImageZoomViewer } from "./ImageZoomViewer";

type AchievementsTab = "academic" | "sports";
type ClassTab = "12" | "10";

export function Excellence() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [tab, setTab] = useState<AchievementsTab>("academic");
  const [classTab, setClassTab] = useState<ClassTab>("12");
  const [showSchoolToppers, setShowSchoolToppers] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const { toppers: toppers12, loading: loading12 } = useToppers("12");
  const { toppers: toppers10, loading: loading10 } = useToppers("10");
  const toppers = classTab === "12" ? toppers12 : toppers10;
  const loading = classTab === "12" ? loading12 : loading10;

  // Fetch sports achievements from API
  const { achievements: apiSportsAchievements } = useAchievements("sports");
  // Use API data if available, otherwise fall back to hardcoded data
  const displaySportsAchievements = apiSportsAchievements.length > 0 ? apiSportsAchievements : sportsAchievements;

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

        {/* School Toppers Inline Accordion */}
        <div className="mb-12">
          <button
            onClick={() => setShowSchoolToppers(!showSchoolToppers)}
            className="w-full max-w-2xl mx-auto block rounded-2xl border border-school-navy/8 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-school-gold/30"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="font-serif text-lg font-bold text-school-navy">
                  School Toppers
                </h3>
                <p className="mt-1 text-sm text-school-muted">
                  View our highest achievers across all classes
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-school-gold/15 transition-transform duration-300 ${showSchoolToppers ? 'rotate-180' : ''}`}>
                <Icon name="arrow" className="h-5 w-5 text-school-gold transform -rotate-90" />
              </div>
            </div>
          </button>

          {/* School Toppers Content */}
          {showSchoolToppers && (
            <div className="mt-6 space-y-8 animate-in fade-in duration-300">
              {/* Class XII Toppers */}
              <div>
                <h4 className="mb-4 text-center font-serif text-xl font-bold text-school-navy">
                  Class XII Toppers
                </h4>
                <div className="grid gap-6 md:grid-cols-3">
                  {loading12 ? (
                    <div className="col-span-full text-center py-8 text-school-muted">
                      Loading Class XII toppers...
                    </div>
                  ) : toppers12.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-school-muted">
                      No Class XII toppers available yet.
                    </div>
                  ) : (
                    toppers12.map((student, index) => (
                      <div
                        key={student.id}
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
                          {student.media?.imageUrl ? (
                            <img
                              src={student.media.imageUrl}
                              alt={student.media.alt || student.student_name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full bg-school-cream-alt flex items-center justify-center">
                              <Icon name="user" className="h-10 w-10 text-school-muted" />
                            </div>
                          )}
                        </div>
                        <h3 className="mt-5 font-serif text-xl font-bold text-school-navy">
                          {student.student_name}
                        </h3>
                        <p className="mt-2 text-3xl font-extrabold tracking-tight text-school-gold-hover">
                          {student.score}
                        </p>
                        {student.stream && (
                          <span className="mt-2 inline-block rounded-full bg-school-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-school-muted">
                            {student.stream}
                          </span>
                        )}
                        {student.centums_scored > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-school-gold">
                              {student.centums_scored} Centum{student.centums_scored !== 1 ? 's' : ''}
                            </div>
                            {student.centum_subjects && student.centum_subjects.length > 0 && (
                              <ul className="mt-2 space-y-1 text-[11px] text-school-muted">
                                {student.centum_subjects.map((subject, idx) => (
                                  <li key={idx}>• {subject}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        {student.academic_year && (
                          <p className="mt-3 text-xs font-medium text-school-muted-light">
                            {student.academic_year}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Class X Toppers */}
              <div>
                <h4 className="mb-4 text-center font-serif text-xl font-bold text-school-navy">
                  Class X Toppers
                </h4>
                <div className="grid gap-6 md:grid-cols-3">
                  {loading10 ? (
                    <div className="col-span-full text-center py-8 text-school-muted">
                      Loading Class X toppers...
                    </div>
                  ) : toppers10.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-school-muted">
                      No Class X toppers available yet.
                    </div>
                  ) : (
                    toppers10.map((student, index) => (
                      <div
                        key={student.id}
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
                          {student.media?.imageUrl ? (
                            <img
                              src={student.media.imageUrl}
                              alt={student.media.alt || student.student_name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full bg-school-cream-alt flex items-center justify-center">
                              <Icon name="user" className="h-10 w-10 text-school-muted" />
                            </div>
                          )}
                        </div>
                        <h3 className="mt-5 font-serif text-xl font-bold text-school-navy">
                          {student.student_name}
                        </h3>
                        <p className="mt-2 text-3xl font-extrabold tracking-tight text-school-gold-hover">
                          {student.score}
                        </p>
                        {student.centums_scored > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-school-gold">
                              {student.centums_scored} Centum{student.centums_scored !== 1 ? 's' : ''}
                            </div>
                            {student.centum_subjects && student.centum_subjects.length > 0 && (
                              <ul className="mt-2 space-y-1 text-[11px] text-school-muted">
                                {student.centum_subjects.map((subject, idx) => (
                                  <li key={idx}>• {subject}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        {student.academic_year && (
                          <p className="mt-3 text-xs font-medium text-school-muted-light">
                            {student.academic_year}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
              {loading ? (
                <div className="col-span-full text-center py-12 text-school-muted">
                  Loading toppers...
                </div>
              ) : toppers.length === 0 ? (
                <div className="col-span-full text-center py-12 text-school-muted">
                  No toppers available yet.
                </div>
              ) : (
                toppers.map((student, index) => (
                  <div
                    key={student.id}
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
                      {student.media?.imageUrl ? (
                        <img
                          src={student.media.imageUrl}
                          alt={student.media.alt || student.student_name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-school-cream-alt flex items-center justify-center">
                          <Icon name="user" className="h-10 w-10 text-school-muted" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-5 font-serif text-xl font-bold text-school-navy">
                      {student.student_name}
                    </h3>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-school-gold-hover">
                      {student.score}
                    </p>
                    {classTab === "12" && student.stream && (
                      <span className="mt-2 inline-block rounded-full bg-school-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-school-muted">
                        {student.stream}
                      </span>
                    )}
                    {student.centums_scored > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-school-gold">
                          {student.centums_scored} Centum{student.centums_scored !== 1 ? 's' : ''}
                        </div>
                        {student.centum_subjects && student.centum_subjects.length > 0 && (
                          <ul className="mt-2 space-y-1 text-[11px] text-school-muted">
                            {student.centum_subjects.map((subject, idx) => (
                              <li key={idx}>• {subject}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
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
              {displaySportsAchievements.map((item: any) => (
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
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-school-navy shadow-lg group cursor-pointer"
              onClick={() => setZoomImageUrl(campusImages.sports)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setZoomImageUrl(campusImages.sports);
                }
              }}
              aria-label="Click to zoom sports image"
            >
              <img
                src={campusImages.sports}
                alt="Athletics champions"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
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

        {/* Image Zoom Viewer */}
        <ImageZoomViewer
          imageUrl={zoomImageUrl || ""}
          alt="Zoomed achievement image"
          isOpen={zoomImageUrl !== null}
          onClose={() => setZoomImageUrl(null)}
        />
      </div>
    </section>
  );
}

