import { useState, useCallback, useId, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';
import type { CourseGroup } from '../../data/photoService';
import {
  fetchAdminKeyedDescription,
  fetchPublicKeyedDescription,
  saveKeyedDescription,
} from '../../services/photoKeyApi';

export const COURSE_GROUPS_RECORD_KEY = 'higher-secondary.course-groups';

export const DEFAULT_COURSE_GROUPS: CourseGroup[] = [
  { id: 'group-1', name: 'GROUP 1', order: 1, subjects: ['Tamil', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology'] },
  { id: 'group-2', name: 'GROUP 2', order: 2, subjects: ['Tamil', 'English', 'Physics', 'Chemistry', 'Mathematics', 'C.S.'] },
  { id: 'group-3-em', name: 'GROUP 3 (EM)', order: 3, subjects: ['Tamil', 'English', 'Commerce', 'Accountancy', 'Economics', 'C.Application'] },
  { id: 'group-4-tm', name: 'GROUP 4 (TM)', order: 4, subjects: ['Tamil', 'English', 'Commerce', 'Accountancy', 'Economics', 'C.Application'] },
  { id: 'group-5', name: 'GROUP 5', order: 5, subjects: ['Tamil', 'English', 'Commerce', 'Accountancy', 'Economics', 'B.Maths'] },
];

/**
 * Admin panel component for managing Class XI Course Groups.
 * Fully backed by FastAPI & SQLite content_records.
 */
export function CoursesOfferedManager() {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-group new-subject input state: map groupId → input value
  const [subjectInputs, setSubjectInputs] = useState<Record<string, string>>({});
  const [subjectErrors, setSubjectErrors] = useState<Record<string, string>>({});

  // New group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupError, setNewGroupError] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState('');
  const uid = useId();

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await fetchAdminKeyedDescription(COURSE_GROUPS_RECORD_KEY).catch(() =>
        fetchPublicKeyedDescription(COURSE_GROUPS_RECORD_KEY)
      );
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setGroups(parsed.groups || DEFAULT_COURSE_GROUPS);
        } catch {
          setGroups(DEFAULT_COURSE_GROUPS);
        }
      } else {
        setGroups(DEFAULT_COURSE_GROUPS);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course groups');
      setGroups(DEFAULT_COURSE_GROUPS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const saveGroupsToBackend = async (newGroups: CourseGroup[], successMsg?: string) => {
    try {
      setGroups(newGroups);
      await saveKeyedDescription(
        COURSE_GROUPS_RECORD_KEY,
        JSON.stringify({ groups: newGroups })
      );
      if (successMsg) showSuccess(successMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to persist course groups');
    }
  };

  /* ── Add Subject to a Group ── */
  const handleAddSubject = useCallback(
    async (groupId: string) => {
      const raw = (subjectInputs[groupId] ?? '').trim();
      if (!raw) {
        setSubjectErrors((e) => ({ ...e, [groupId]: 'Subject name cannot be empty.' }));
        return;
      }
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const isDuplicate = group.subjects.some(
        (s) => s.toLowerCase() === raw.toLowerCase()
      );
      if (isDuplicate) {
        setSubjectErrors((e) => ({ ...e, [groupId]: `"${raw}" already exists in this group.` }));
        return;
      }

      const updated = groups.map((g) =>
        g.id === groupId ? { ...g, subjects: [...g.subjects, raw] } : g
      );
      setSubjectInputs((inp) => ({ ...inp, [groupId]: '' }));
      setSubjectErrors((e) => ({ ...e, [groupId]: '' }));
      await saveGroupsToBackend(updated, `Subject "${raw}" added to ${group.name}.`);
    },
    [groups, subjectInputs, saveGroupsToBackend]
  );

  /* ── Remove Subject from a Group ── */
  const handleRemoveSubject = useCallback(
    async (groupId: string, subject: string) => {
      const updated = groups.map((g) =>
        g.id === groupId
          ? { ...g, subjects: g.subjects.filter((s) => s !== subject) }
          : g
      );
      await saveGroupsToBackend(updated, `Subject "${subject}" removed.`);
    },
    [groups, saveGroupsToBackend]
  );

  /* ── Delete an Entire Group ── */
  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      if (!window.confirm(`Delete "${group.name}" and all its subjects? This cannot be undone.`)) return;
      await saveGroupsToBackend(
        groups.filter((g) => g.id !== groupId),
        `Group "${group.name}" deleted.`
      );
    },
    [groups, saveGroupsToBackend]
  );

  /* ── Add New Group ── */
  const handleAddGroup = useCallback(async () => {
    const raw = newGroupName.trim();
    if (!raw) {
      setNewGroupError('Group name cannot be empty.');
      return;
    }
    const isDuplicate = groups.some((g) => g.name.toLowerCase() === raw.toLowerCase());
    if (isDuplicate) {
      setNewGroupError(`A group named "${raw}" already exists.`);
      return;
    }
    const newGroup: CourseGroup = {
      id: `group-custom-${Date.now()}`,
      name: raw,
      order: groups.length + 1,
      subjects: [],
    };
    setNewGroupName('');
    setNewGroupError('');
    setShowNewGroupInput(false);
    await saveGroupsToBackend([...groups, newGroup], `Group "${raw}" created.`);
  }, [groups, newGroupName, saveGroupsToBackend]);

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Courses Offered – Class XI"
        description="Manage the groups and subjects shown in the Higher Secondary Courses Offered section. Saved directly to SQLite database."
      />

      {/* Error message */}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          <Icon name="check" className="h-4 w-4 shrink-0 text-green-600" />
          {successMessage}
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-6">
        {groups.map((group) => {
          const errorId = `${uid}-err-${group.id}`;
          return (
            <div
              key={group.id}
              className="rounded-2xl border border-school-navy/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-lg font-bold text-school-navy">{group.name}</h3>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  aria-label={`Delete ${group.name}`}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>

              {/* Subject Badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {group.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="inline-flex items-center gap-1.5 rounded-full border border-school-navy/10 bg-school-cream-alt px-3 py-1 text-xs font-medium text-school-navy"
                  >
                    {subject}
                    <button
                      onClick={() => handleRemoveSubject(group.id, subject)}
                      aria-label={`Remove ${subject} from ${group.name}`}
                      className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-school-muted transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none"
                    >
                      <Icon name="x" className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Subject Input */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    value={subjectInputs[group.id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubjectInputs((prev) => ({ ...prev, [group.id]: val }));
                      setSubjectErrors((err) => ({ ...err, [group.id]: '' }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject(group.id);
                      }
                    }}
                    placeholder="Add a subject…"
                    aria-describedby={subjectErrors[group.id] ? errorId : undefined}
                    className="w-full rounded-lg border border-school-navy/15 bg-school-cream-alt px-3 py-2 text-sm text-school-navy placeholder:text-school-muted focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/30"
                  />
                  {subjectErrors[group.id] && (
                    <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
                      {subjectErrors[group.id]}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddSubject(group.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-school-gold px-4 py-2 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-school-gold/60"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Subject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Group */}
      <div className="rounded-2xl border border-dashed border-school-navy/20 bg-school-cream-alt p-6">
        {!showNewGroupInput ? (
          <button
            onClick={() => setShowNewGroupInput(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-school-navy/20 bg-white px-4 py-2 text-sm font-semibold text-school-navy transition-colors hover:border-school-gold hover:bg-school-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-school-gold/60"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add New Group
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <label
              htmlFor={`${uid}-new-group`}
              className="text-sm font-semibold text-school-navy"
            >
              New Group Name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id={`${uid}-new-group`}
                type="text"
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  setNewGroupError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGroup();
                  }
                  if (e.key === 'Escape') {
                    setShowNewGroupInput(false);
                    setNewGroupName('');
                    setNewGroupError('');
                  }
                }}
                placeholder="e.g. GROUP 6"
                autoFocus
                className="flex-1 rounded-lg border border-school-navy/15 bg-white px-3 py-2 text-sm text-school-navy placeholder:text-school-muted focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddGroup}
                  className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-school-gold/60"
                >
                  <Icon name="save" className="h-4 w-4" />
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewGroupInput(false);
                    setNewGroupName('');
                    setNewGroupError('');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-school-navy/15 bg-white px-4 py-2 text-sm font-semibold text-school-navy transition-colors hover:bg-school-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-school-gold/60"
                >
                  <Icon name="x" className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
            {newGroupError && (
              <p role="alert" className="text-xs text-red-600">{newGroupError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
