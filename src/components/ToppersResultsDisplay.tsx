import { useState, useMemo } from 'react';
import { useToppers } from '../hooks/useToppers';
import { Icon } from './Icon';

interface ToppersResultsDisplayProps {
  gradeLevel: '10' | '12';
  title: string;
}

interface AcademicYearGroup {
  year: string;
  overallToppers: Array<any>;
  subjectWiseToppers: Array<any>;
}

export function ToppersResultsDisplay({ gradeLevel, title }: ToppersResultsDisplayProps) {
  const { toppers, loading } = useToppers(gradeLevel);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);

  // Group toppers by academic year
  const academicYearGroups = useMemo(() => {
    const overall = toppers.filter((t) => t.rank !== null && t.rank !== undefined);
    const subjectWise = toppers.filter((t) => t.subject !== null && t.subject !== undefined);

    // Get unique years from overall toppers, sorted descending
    const yearsSet = new Set<string>();
    overall.forEach((t) => {
      if (t.academic_year) yearsSet.add(t.academic_year);
    });
    subjectWise.forEach((t) => {
      if (t.academic_year) yearsSet.add(t.academic_year);
    });

    const years = Array.from(yearsSet).sort().reverse(); // Most recent first

    // If no years found, use a default grouping
    if (years.length === 0) {
      return [
        {
          year: 'All Results',
          overallToppers: overall,
          subjectWiseToppers: subjectWise,
        },
      ];
    }

    // Group by year
    const groups: AcademicYearGroup[] = years.map((year) => ({
      year,
      overallToppers: overall.filter((t) => t.academic_year === year),
      subjectWiseToppers: subjectWise.filter((t) => t.academic_year === year),
    }));

    return groups;
  }, [toppers]);

  if (loading) {
    return (
      <section className="py-24 bg-school-cream">
        <div className="mx-auto max-w-6xl px-6 lg:px-16">
          <h2 className="font-serif text-3xl font-bold text-school-navy mb-12 text-center">{title}</h2>
          <div className="text-center py-12 text-school-muted">Loading results...</div>
        </div>
      </section>
    );
  }

  if (academicYearGroups.length === 0 || academicYearGroups[0].overallToppers.length === 0) {
    return (
      <section className="py-24 bg-school-cream">
        <div className="mx-auto max-w-6xl px-6 lg:px-16">
          <h2 className="font-serif text-3xl font-bold text-school-navy mb-12 text-center">{title}</h2>
          <div className="text-center py-12 text-school-muted">No results available yet.</div>
        </div>
      </section>
    );
  }

  const currentGroup = academicYearGroups[currentYearIndex];
  const goNext = () =>
    setCurrentYearIndex((i) => (i + 1) % academicYearGroups.length);
  const goPrev = () =>
    setCurrentYearIndex(
      (i) => (i - 1 + academicYearGroups.length) % academicYearGroups.length
    );

  // Sort to get 1st, 2nd, 3rd
  const rankedToppers = currentGroup.overallToppers
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))
    .slice(0, 3);
  const first = rankedToppers.find((t) => t.rank === 1);
  const second = rankedToppers.find((t) => t.rank === 2);
  const third = rankedToppers.find((t) => t.rank === 3);

  return (
    <section className="py-24 bg-school-cream">
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <h2 className="font-serif text-3xl font-bold text-school-navy mb-12 text-center">{title}</h2>

        {/* Year Slider Navigation */}
        {academicYearGroups.length > 1 && (
          <div className="mb-12 flex items-center justify-center gap-4">
            <button
              onClick={goPrev}
              className="rounded-full bg-school-gold p-3 text-school-navy hover:bg-school-gold-hover transition-colors"
              aria-label="Previous year"
            >
              <Icon name="arrow" className="h-5 w-5 rotate-180" />
            </button>

            <div className="text-center min-w-[200px]">
              <span className="text-lg font-semibold text-school-navy">
                {currentGroup.year}
              </span>
              {academicYearGroups.length > 1 && (
                <div className="text-xs text-school-muted mt-1">
                  {currentYearIndex + 1} of {academicYearGroups.length}
                </div>
              )}
            </div>

            <button
              onClick={goNext}
              className="rounded-full bg-school-gold p-3 text-school-navy hover:bg-school-gold-hover transition-colors"
              aria-label="Next year"
            >
              <Icon name="arrow" className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Overall Toppers Podium */}
        {rankedToppers.length > 0 && (
          <div className="mb-16">
            <h3 className="font-serif text-2xl font-bold text-school-navy mb-8 text-center">
              Overall Toppers
            </h3>

            {/* Podium Layout - Responsive */}
            <div className="grid gap-4 sm:gap-6 md:gap-4 lg:gap-8 grid-cols-1 sm:grid-cols-3 mb-8">
              {/* 2nd Place - Left */}
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center justify-end w-full h-auto sm:h-80 md:h-72 lg:h-80">
                  {/* Photo Container - 2nd Place */}
                  <div className="relative">
                    {second?.media?.imageUrl ? (
                      <div className="relative h-48 w-40 sm:h-40 sm:w-32 md:h-48 md:w-40 overflow-hidden rounded-2xl border-4 border-gray-300 shadow-lg">
                        <img
                          src={second.media.imageUrl}
                          alt={second.student_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white text-sm font-bold shadow-lg">
                          2
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-48 w-40 sm:h-40 sm:w-32 md:h-48 md:w-40 rounded-2xl border-4 border-gray-300 bg-gray-100 flex items-center justify-center">
                        <Icon name="image" className="h-12 w-12 text-school-muted" />
                        <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white text-sm font-bold shadow-lg">
                          2
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge and Details */}
                <div className="mt-4 text-center w-full px-2">
                  <h4 className="font-serif text-sm sm:text-base md:text-lg font-bold text-school-navy break-words">
                    {second?.student_name || '—'}
                  </h4>
                  {second && (
                    <>
                      <p className="text-xs sm:text-sm text-school-muted mt-1 font-semibold">{second.score}</p>
                      {gradeLevel === '12' && second.stream && (
                        <p className="text-xs text-school-muted mt-1">{second.stream}</p>
                      )}
                      {second.centum_subjects && second.centum_subjects.length > 0 && (
                        <div className="mt-2 text-xs text-school-navy">
                          <p className="font-semibold">Centums:</p>
                          <div className="mt-1 space-y-0.5">
                            {second.centum_subjects.map((subject: string, idx: number) => (
                              <div key={idx} className="text-school-muted">{subject}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 1st Place - Center */}
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center justify-end w-full h-auto sm:h-80 md:h-72 lg:h-80">
                  {/* Photo Container - 1st Place */}
                  <div className="relative">
                    {first?.media?.imageUrl ? (
                      <div className="relative h-56 w-48 sm:h-48 sm:w-40 md:h-56 md:w-48 overflow-hidden rounded-2xl border-4 border-yellow-400 shadow-2xl">
                        <img
                          src={first.media.imageUrl}
                          alt={first.student_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 text-base font-bold shadow-lg">
                          1
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-56 w-48 sm:h-48 sm:w-40 md:h-56 md:w-48 rounded-2xl border-4 border-yellow-400 bg-gray-100 flex items-center justify-center">
                        <Icon name="image" className="h-16 w-16 text-school-muted" />
                        <div className="absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 text-base font-bold shadow-lg">
                          1
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge and Details */}
                <div className="mt-4 text-center w-full px-2">
                  <h4 className="font-serif text-sm sm:text-base md:text-lg font-bold text-school-navy break-words">
                    {first?.student_name || '—'}
                  </h4>
                  {first && (
                    <>
                      <p className="text-xs sm:text-sm text-school-muted mt-1 font-semibold">{first.score}</p>
                      {gradeLevel === '12' && first.stream && (
                        <p className="text-xs text-school-muted mt-1">{first.stream}</p>
                      )}
                      {first.centum_subjects && first.centum_subjects.length > 0 && (
                        <div className="mt-2 text-xs text-school-navy">
                          <p className="font-semibold">Centums:</p>
                          <div className="mt-1 space-y-0.5">
                            {first.centum_subjects.map((subject: string, idx: number) => (
                              <div key={idx} className="text-school-muted">{subject}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 3rd Place - Right */}
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center justify-end w-full h-auto sm:h-80 md:h-72 lg:h-80">
                  {/* Photo Container - 3rd Place */}
                  <div className="relative">
                    {third?.media?.imageUrl ? (
                      <div className="relative h-40 w-32 sm:h-32 sm:w-28 md:h-40 md:w-32 overflow-hidden rounded-2xl border-4 border-orange-400 shadow-lg">
                        <img
                          src={third.media.imageUrl}
                          alt={third.student_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900 text-sm font-bold shadow-lg">
                          3
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-40 w-32 sm:h-32 sm:w-28 md:h-40 md:w-32 rounded-2xl border-4 border-orange-400 bg-gray-100 flex items-center justify-center">
                        <Icon name="image" className="h-10 w-10 text-school-muted" />
                        <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900 text-sm font-bold shadow-lg">
                          3
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge and Details */}
                <div className="mt-4 text-center w-full px-2">
                  <h4 className="font-serif text-sm sm:text-base md:text-lg font-bold text-school-navy break-words">
                    {third?.student_name || '—'}
                  </h4>
                  {third && (
                    <>
                      <p className="text-xs sm:text-sm text-school-muted mt-1 font-semibold">{third.score}</p>
                      {gradeLevel === '12' && third.stream && (
                        <p className="text-xs text-school-muted mt-1">{third.stream}</p>
                      )}
                      {third.centum_subjects && third.centum_subjects.length > 0 && (
                        <div className="mt-2 text-xs text-school-navy">
                          <p className="font-semibold">Centums:</p>
                          <div className="mt-1 space-y-0.5">
                            {third.centum_subjects.map((subject: string, idx: number) => (
                              <div key={idx} className="text-school-muted">{subject}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject-wise Toppers */}
        {currentGroup.subjectWiseToppers.length > 0 && (
          <div>
            <h3 className="font-serif text-2xl font-bold text-school-navy mb-8 text-center">
              Subject-wise Toppers
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentGroup.subjectWiseToppers.map((topper: any) => (
                <div
                  key={topper.id}
                  className="rounded-2xl border border-school-navy/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-school-navy text-lg break-words">
                    {topper.subject}
                  </h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-school-navy">
                      <span className="font-semibold">Student:</span> {topper.student_name}
                    </p>
                    <p className="text-school-muted">
                      <span className="font-semibold text-school-navy">Score:</span> {topper.score}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for current year */}
        {rankedToppers.length === 0 && currentGroup.subjectWiseToppers.length === 0 && (
          <div className="text-center py-12 text-school-muted">
            <p>No results available for {currentGroup.year}</p>
          </div>
        )}
      </div>
    </section>
  );
}
