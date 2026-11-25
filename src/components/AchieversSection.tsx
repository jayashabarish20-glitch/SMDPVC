import { useState, useMemo, useEffect } from 'react';
import { useToppers } from '../hooks/useToppers';
import { Icon } from './Icon';

interface AchieversSectionProps {
  gradeLevel: '10' | '12';
}

export function AchieversSection({ gradeLevel }: AchieversSectionProps) {
  const { toppers, loading } = useToppers(gradeLevel);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Group toppers by academic year
  const academicYears = useMemo(() => {
    const years = new Set<string>();
    toppers.forEach((t) => {
      if (t.academic_year) years.add(t.academic_year);
    });
    return Array.from(years).sort().reverse();
  }, [toppers]);

  const currentYear = academicYears[currentYearIndex] || null;

  // Reset year index when years change
  useEffect(() => {
    setCurrentYearIndex(0);
  }, [academicYears.length]);

  if (loading) {
    return (
      <div className="mt-6">
        <div className="text-center py-12 text-school-muted">Loading achievers...</div>
      </div>
    );
  }

  if (academicYears.length === 0) {
    return (
      <div className="mt-6">
        <div className="text-center py-12 text-school-muted">No results available yet.</div>
      </div>
    );
  }

  // Filter toppers by current year
  const toppersForYear = currentYear
    ? toppers.filter((t) => t.academic_year === currentYear)
    : [];

  const overallToppers = toppersForYear.filter((t) => t.rank !== null && t.rank !== undefined);
  const subjectWiseToppers = toppersForYear.filter((t) => t.subject !== null && t.subject !== undefined);

  // Filter subject-wise by search
  const filteredSubjectWise = subjectWiseToppers.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const goNext = () => setCurrentYearIndex((i) => (i + 1) % academicYears.length);
  const goPrev = () => setCurrentYearIndex((i) => (i - 1 + academicYears.length) % academicYears.length);

  return (
    <div className="mt-6">
      {/* Year Navigation */}
      {academicYears.length > 1 && (
        <div className="mb-12 flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            className="rounded-full bg-school-gold p-3 text-school-navy hover:bg-school-gold-hover transition-colors"
            aria-label="Previous year"
          >
            <Icon name="arrow" className="h-5 w-5 rotate-180" />
          </button>

          <div className="text-center min-w-[220px]">
            <span className="text-lg font-semibold text-school-navy">
              {currentYear}
            </span>
            {academicYears.length > 1 && (
              <div className="text-xs text-school-muted mt-1">
                {currentYearIndex + 1} of {academicYears.length}
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

      {/* Two-Column Layout: Desktop | One-Column: Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN – OVERALL TOPPERS */}
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h3 className="font-serif text-xl font-bold text-school-navy mb-6 text-center">
            Overall Toppers
          </h3>

          {overallToppers.length > 0 ? (
            <div className="space-y-6">
              {overallToppers.map((topper) => (
                <OverallTopperCard key={topper.id} topper={topper} gradeLevel={gradeLevel} />
              ))}
            </div>
          ) : (
            <p className="text-center text-school-muted py-6">No overall toppers for this year.</p>
          )}
        </div>

        {/* RIGHT COLUMN – SUBJECT-WISE TOPPERS */}
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h3 className="font-serif text-xl font-bold text-school-navy mb-6 text-center">
            Subject-wise Toppers
          </h3>

          {/* Search bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-school-navy/20 rounded-lg text-sm focus:outline-none focus:border-school-gold"
            />
          </div>

          {/* Subject-wise list */}
          {filteredSubjectWise.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredSubjectWise.map((topper) => (
                <SubjectWiseCard key={topper.id} topper={topper} gradeLevel={gradeLevel} />
              ))}
            </div>
          ) : (
            <p className="text-center text-school-muted py-6">
              {searchQuery ? 'No matches found.' : 'No subject-wise toppers for this year.'}
            </p>
          )}
        </div>
      </div>

      {/* Empty state for current year */}
      {overallToppers.length === 0 && subjectWiseToppers.length === 0 && (
        <div className="text-center py-12 text-school-muted">
          <p>No achievers available for {currentYear}</p>
        </div>
      )}
    </div>
  );
}

interface OverallTopperCardProps {
  topper: any;
  gradeLevel: '10' | '12';
}

function OverallTopperCard({ topper, gradeLevel }: OverallTopperCardProps) {
  const rank = topper.rank as 1 | 2 | 3;

  return (
    <div className="bg-white rounded-2xl border border-school-navy/5 p-6 shadow-md hover:shadow-lg transition-shadow">
      {/* Two-part horizontal layout: Medal LEFT | Student Info RIGHT */}
      <div className="flex gap-6">
        {/* LEFT SECTION – RANK AND MEDAL */}
        <div className="flex-shrink-0 flex flex-col items-center pt-2">
          <div className="text-sm font-bold text-school-navy mb-2">Rank {rank}</div>
          <MedalComponent rank={rank} />
        </div>

        {/* VERTICAL DIVIDER */}
        <div className="w-px bg-school-navy/10" />

        {/* RIGHT SECTION – STUDENT INFORMATION */}
        <div className="flex-1 flex gap-4">
          {/* Student Photo */}
          <div className="flex-shrink-0">
            {topper.media?.imageUrl ? (
              <img
                src={topper.media.imageUrl}
                alt={topper.student_name}
                className="h-40 w-32 rounded-xl object-cover border-2 border-school-navy/10"
              />
            ) : (
              <div className="h-40 w-32 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-school-navy/10">
                <Icon name="image" className="h-10 w-10 text-school-muted" />
              </div>
            )}
          </div>

          {/* Student Details */}
          <div className="flex-1 flex flex-col justify-start">
            <h4 className="font-serif text-lg font-bold text-school-navy break-words">
              {topper.student_name}
            </h4>

            {gradeLevel === '12' && topper.stream && (
              <p className="text-sm text-school-muted mt-1">{topper.stream}</p>
            )}

            <p className="text-base font-bold text-school-navy mt-3">{topper.score}</p>

            {topper.centums_scored > 0 && (
              <div className="mt-3 pt-3 border-t border-school-navy/10">
                <p className="text-sm font-semibold text-school-navy">
                  Centum: {topper.centums_scored}
                </p>
                {topper.centum_subjects && topper.centum_subjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topper.centum_subjects.map((subject: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-school-gold/10 text-xs rounded text-school-navy font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MedalComponentProps {
  rank: 1 | 2 | 3;
}

function MedalComponent({ rank }: MedalComponentProps) {
  const medalColors = {
    1: { medal: '#FFD700', ribbon: '#DC143C' },
    2: { medal: '#C0C0C0', ribbon: '#808080' },
    3: { medal: '#CD7F32', ribbon: '#8B4513' },
  };

  const colors = medalColors[rank];

  return (
    <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-lg">
      {/* Ribbons */}
      <rect x="20" y="0" width="8" height="30" fill={colors.ribbon} rx="2" />
      <rect x="52" y="0" width="8" height="30" fill={colors.ribbon} rx="2" />

      {/* Medal circle */}
      <circle cx="40" cy="55" r="20" fill={colors.medal} />

      {/* Medal inner edge (embossed effect) */}
      <circle cx="40" cy="55" r="20" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <circle cx="40" cy="55" r="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* Medal ridges */}
      <circle cx="40" cy="55" r="16" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" strokeDasharray="3,2" />

      {/* Rank number in center */}
      <text
        x="40"
        y="62"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="28"
        fontWeight="bold"
        fill="rgba(0,0,0,0.8)"
        fontFamily="serif"
      >
        {rank}
      </text>
    </svg>
  );
}

interface SubjectWiseCardProps {
  topper: any;
  gradeLevel: '10' | '12';
}

function SubjectWiseCard({ topper, gradeLevel }: SubjectWiseCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-school-navy/5 hover:shadow-sm transition-shadow">
      {/* Horizontal layout: Photo | Details */}
      <div className="flex gap-3">
        {/* Photo - Left */}
        <div className="flex-shrink-0">
          {topper.media?.imageUrl ? (
            <img
              src={topper.media.imageUrl}
              alt={topper.student_name}
              className="h-24 w-20 rounded object-cover border border-school-navy/10"
            />
          ) : (
            <div className="h-24 w-20 rounded bg-gray-200 flex items-center justify-center border border-school-navy/10">
              <Icon name="image" className="h-5 w-5 text-school-muted" />
            </div>
          )}
        </div>

        {/* Details - Right */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-school-navy break-words">
            {topper.student_name}
          </h4>

          <div className="mt-1 space-y-0.5 text-xs text-school-muted">
            {topper.class_name && (
              <p>
                <span className="font-semibold text-school-navy">Class:</span> {topper.class_name}
              </p>
            )}

            {topper.section && (
              <p>
                <span className="font-semibold text-school-navy">Section:</span> {topper.section}
              </p>
            )}

            {gradeLevel === '12' && topper.stream && (
              <p>
                <span className="font-semibold text-school-navy">Stream:</span> {topper.stream}
              </p>
            )}

            {topper.subject && (
              <p>
                <span className="font-semibold text-school-navy">Subject:</span> {topper.subject}
              </p>
            )}

            {topper.score && (
              <p>
                <span className="font-semibold text-school-navy">Marks:</span> {topper.score}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
