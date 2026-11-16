import type { CourseGroup } from '../data/photoService';

interface CoursesOfferedSectionProps {
  groups: CourseGroup[];
}

/**
 * Public display for the Higher Secondary "Courses Offered – Class XI" section.
 * Reads from courseGroups in photoService (localStorage-backed).
 * Matches the site's existing visual design: school-navy, school-gold, school-cream tokens.
 */
export function CoursesOfferedSection({ groups }: CoursesOfferedSectionProps) {
  if (!groups || groups.length === 0) {
    return (
      <p className="mt-4 text-sm leading-relaxed text-school-muted">
        Course information will be available soon.
      </p>
    );
  }

  const sorted = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((group) => (
        <div
          key={group.id}
          className="rounded-2xl border border-school-navy/8 bg-white p-5 shadow-sm"
        >
          {/* Group name bar */}
          <div className="mb-4 inline-block rounded-lg bg-school-navy px-3 py-1">
            <span className="text-xs font-bold uppercase tracking-wider text-school-gold">
              {group.name}
            </span>
          </div>

          {/* Subject list */}
          {group.subjects.length === 0 ? (
            <p className="text-xs text-school-muted">No subjects listed.</p>
          ) : (
            <ul className="space-y-1.5">
              {group.subjects.map((subject, idx) => (
                <li key={`${subject}-${idx}`} className="flex items-center gap-2 text-sm text-school-navy">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-school-gold" />
                  {subject}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

