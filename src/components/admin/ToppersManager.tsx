import { useState } from 'react';
import type { Topper } from '../../hooks/useToppers';
import { useAdminToppers } from '../../hooks/useToppers';
import { uploadImage } from '../../services/mediaUploadApi';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';

interface OverallTopperFormData {
  student_name: string;
  rank: '1' | '2' | '3' | '';
  score: string;
  stream: string;
  centums_scored: string;
  centum_subjects: string[];
  academic_year: string;
  media_id: string | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

interface SubjectWiseTopperFormData {
  subject: string;
  student_name: string;
  score: string;
  academic_year: string;
  class_name: string;
  section: string;
  stream: string;
  media_id: string | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

interface ToppersManagerProps {
  gradeLevel?: '10' | '12';
}

export function ToppersManager({ gradeLevel }: ToppersManagerProps = {}) {
  const [activeGrade, setActiveGrade] = useState<'12' | '10'>(gradeLevel || '12');
  const [activeTab, setActiveTab] = useState<'overall' | 'subject-wise'>('overall');
  const [showAddOverallForm, setShowAddOverallForm] = useState(false);
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [editingTopperId, setEditingTopperId] = useState<string | null>(null);
  const [editingSubjectTopperId, setEditingSubjectTopperId] = useState<string | null>(null);

  const [overallFormData, setOverallFormData] = useState<OverallTopperFormData>({
    student_name: '',
    rank: '',
    score: '',
    stream: '',
    centums_scored: '',
    centum_subjects: [],
    academic_year: new Date().getFullYear().toString(),
    media_id: null,
    imageFile: null,
    imagePreviewUrl: null,
  });

  const [subjectFormData, setSubjectFormData] = useState<SubjectWiseTopperFormData>({
    subject: '',
    student_name: '',
    score: '',
    academic_year: new Date().getFullYear().toString(),
    class_name: '',
    section: '',
    stream: '',
    media_id: null,
    imageFile: null,
    imagePreviewUrl: null,
  });

  const { toppers, loading, addTopper, updateTopper, deleteTopper } =
    useAdminToppers(activeGrade === '12' ? '12' : '10');

  const gradeValue = activeGrade === '12' ? '12' : '10';
  const overallToppers = toppers.filter(
    (t) => t.grade_level === gradeValue && t.rank !== null && t.rank !== undefined
  );
  const subjectWiseToppers = toppers.filter(
    (t) => t.grade_level === gradeValue && t.subject !== null && t.subject !== undefined
  );

  // Handle Overall Topper Form
  const handleAddOverallClick = () => {
    setOverallFormData({
      student_name: '',
      rank: '',
      score: '',
      stream: activeGrade === '12' ? '' : 'N/A',
      centums_scored: '',
      centum_subjects: [],
      academic_year: new Date().getFullYear().toString(),
      media_id: null,
      imageFile: null,
      imagePreviewUrl: null,
    });
    setEditingTopperId(null);
    setShowAddOverallForm(true);
  };

  const handleEditOverallClick = (topper: Topper) => {
    const rankValue = topper.rank ? String(topper.rank) as '1' | '2' | '3' : '';
    setOverallFormData({
      student_name: topper.student_name,
      rank: rankValue,
      score: topper.score,
      stream: topper.stream,
      centums_scored: topper.centums_scored.toString(),
      centum_subjects: topper.centum_subjects || [],
      academic_year: topper.academic_year || new Date().getFullYear().toString(),
      media_id: topper.media_id,
      imageFile: null,
      imagePreviewUrl: topper.media?.imageUrl || null,
    });
    setEditingTopperId(topper.id);
    setShowAddOverallForm(true);
  };

  const handleSubmitOverall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!overallFormData.student_name || !overallFormData.rank || !overallFormData.score) {
      alert('Please fill in all required fields (Student Name, Rank, Score)');
      return;
    }

    const centumScore = parseInt(overallFormData.centums_scored || '0', 10);
    if (overallFormData.centum_subjects.length !== centumScore) {
      alert(
        `Number of centum subjects (${overallFormData.centum_subjects.length}) must match Centums Scored (${centumScore})`
      );
      return;
    }

    // Check for duplicate rank in same grade and academic year
    const academicYear = overallFormData.academic_year;
    const selectedRank = parseInt(overallFormData.rank, 10);
    const duplicateRank = overallToppers.some(
      (t) =>
        t.rank === selectedRank &&
        t.academic_year === academicYear &&
        t.id !== editingTopperId
    );

    if (duplicateRank) {
      alert(
        `A topper with Rank ${selectedRank} already exists for academic year ${academicYear}`
      );
      return;
    }

    try {
      let mediaId = overallFormData.media_id;

      if (overallFormData.imageFile) {
        const uploadedMedia = await uploadImage(overallFormData.imageFile, overallFormData.student_name);
        mediaId = uploadedMedia.id;
      }

      const topperData = {
        student_name: overallFormData.student_name,
        grade_level: gradeValue,
        academic_year: overallFormData.academic_year,
        score: overallFormData.score,
        stream: overallFormData.stream,
        rank: parseInt(overallFormData.rank, 10),
        subject: null,
        achievement: null,
        centums_scored: centumScore,
        centum_subjects: overallFormData.centum_subjects,
        media_id: mediaId,
        is_published: true,
      };

      if (editingTopperId) {
        await updateTopper(editingTopperId, topperData);
        alert('Topper updated successfully');
      } else {
        await addTopper(topperData);
        alert('Topper added successfully');
      }

      setShowAddOverallForm(false);
      setOverallFormData({
        student_name: '',
        rank: '',
        score: '',
        stream: '',
        centums_scored: '',
        centum_subjects: [],
        academic_year: new Date().getFullYear().toString(),
        media_id: null,
        imageFile: null,
        imagePreviewUrl: null,
      });
    } catch (error) {
      alert(`Failed to save topper: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle Subject-wise Topper Form
  const handleAddSubjectClick = () => {
    setSubjectFormData({
      subject: '',
      student_name: '',
      score: '',
      academic_year: new Date().getFullYear().toString(),
      class_name: '',
      section: '',
      stream: '',
      media_id: null,
      imageFile: null,
      imagePreviewUrl: null,
    });
    setEditingSubjectTopperId(null);
    setShowAddSubjectForm(true);
  };

  const handleEditSubjectClick = (topper: Topper) => {
    setSubjectFormData({
      subject: topper.subject || '',
      student_name: topper.student_name,
      score: topper.score,
      academic_year: topper.academic_year || new Date().getFullYear().toString(),
      class_name: topper.class_name || '',
      section: topper.section || '',
      stream: topper.stream || '',
      media_id: topper.media_id,
      imageFile: null,
      imagePreviewUrl: topper.media?.imageUrl || null,
    });
    setEditingSubjectTopperId(topper.id);
    setShowAddSubjectForm(true);
  };

  const handleSubmitSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!subjectFormData.subject || !subjectFormData.student_name || !subjectFormData.score) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let mediaId = subjectFormData.media_id;

      if (subjectFormData.imageFile) {
        const uploadedMedia = await uploadImage(subjectFormData.imageFile, subjectFormData.student_name);
        mediaId = uploadedMedia.id;
      }

      const topperData = {
        student_name: subjectFormData.student_name,
        grade_level: gradeValue,
        academic_year: subjectFormData.academic_year,
        score: subjectFormData.score,
        stream: activeGrade === '12' ? subjectFormData.stream : '',
        rank: null,
        subject: subjectFormData.subject,
        class_name: subjectFormData.class_name || null,
        section: subjectFormData.section || null,
        achievement: null,
        centums_scored: 0,
        centum_subjects: [],
        media_id: mediaId,
        is_published: true,
      };

      if (editingSubjectTopperId) {
        await updateTopper(editingSubjectTopperId, topperData);
        alert('Subject-wise topper updated successfully');
      } else {
        await addTopper(topperData);
        alert('Subject-wise topper added successfully');
      }

      setShowAddSubjectForm(false);
      setSubjectFormData({
        subject: '',
        student_name: '',
        score: '',
        academic_year: new Date().getFullYear().toString(),
        class_name: '',
        section: '',
        stream: '',
        media_id: null,
        imageFile: null,
        imagePreviewUrl: null,
      });
    } catch (error) {
      alert(`Failed to save topper: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (topperId: string) => {
    if (!window.confirm('Are you sure you want to delete this topper?')) {
      return;
    }

    try {
      await deleteTopper(topperId);
      alert('Topper deleted successfully');
    } catch (error) {
      alert(`Failed to delete topper: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <SectionHeader
        badge="EXAMINATION RESULTS"
        title="School Toppers & Results Management"
        description="Manage SSLC (Class X) and Higher Secondary (Class XII) overall toppers and subject-wise toppers separately."
      />

      {/* Grade Tabs */}
      <div className="mb-8 flex gap-4">
        {(['12', '10'] as const).map((grade) => (
          <button
            key={grade}
            onClick={() => {
              setActiveGrade(grade);
              setShowAddOverallForm(false);
              setShowAddSubjectForm(false);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeGrade === grade
                ? 'bg-school-navy text-white'
                : 'bg-white text-school-navy border border-school-navy/20'
            }`}
          >
            Class {grade} {grade === '12' ? '(Higher Secondary)' : '(SSLC)'}
          </button>
        ))}
      </div>

      {/* Content Tabs */}
      <div className="mb-8 flex gap-4 border-b border-school-navy/10">
        {(['overall', 'subject-wise'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowAddOverallForm(false);
              setShowAddSubjectForm(false);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-school-gold text-school-navy'
                : 'border-transparent text-school-muted hover:text-school-navy'
            }`}
          >
            {tab === 'overall' ? 'Overall Toppers' : 'Subject-wise Toppers'}
          </button>
        ))}
      </div>

      {/* OVERALL TOPPERS SECTION */}
      {activeTab === 'overall' && (
        <div>
          {/* Add Button */}
          <div className="mb-8">
            <button
              onClick={handleAddOverallClick}
              className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-gold-hover"
            >
              <Icon name="plus" className="h-5 w-5" />
              Add Overall Topper
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddOverallForm && (
            <div className="mb-8 rounded-2xl border border-school-navy/10 bg-white p-8">
              <h3 className="mb-6 font-serif text-xl font-bold text-school-navy">
                {editingTopperId ? 'Edit Overall Topper' : 'Add Overall Topper'}
              </h3>
              <form onSubmit={handleSubmitOverall} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={overallFormData.student_name}
                    onChange={(e) =>
                      setOverallFormData({ ...overallFormData, student_name: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="Enter student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Rank *
                  </label>
                  <select
                    value={overallFormData.rank}
                    onChange={(e) =>
                      setOverallFormData({
                        ...overallFormData,
                        rank: e.target.value as '1' | '2' | '3' | '',
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                  >
                    <option value="">Select Rank</option>
                    <option value="1">1st Place</option>
                    <option value="2">2nd Place</option>
                    <option value="3">3rd Place</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Total Marks/Score *
                  </label>
                  <input
                    type="text"
                    value={overallFormData.score}
                    onChange={(e) =>
                      setOverallFormData({ ...overallFormData, score: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="e.g., 480/500 or 585/600"
                  />
                </div>

                {activeGrade === '12' && (
                  <div>
                    <label className="block text-sm font-semibold text-school-navy">
                      Stream (Optional)
                    </label>
                    <select
                      value={overallFormData.stream}
                      onChange={(e) =>
                        setOverallFormData({ ...overallFormData, stream: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    >
                      <option value="">Select or enter custom stream</option>
                      <option value="Bio-Maths">Bio-Maths</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Pure Science">Pure Science</option>
                      <option value="Vocational">Vocational</option>
                    </select>
                    {!['Bio-Maths', 'Computer Science', 'Commerce', 'Pure Science', 'Vocational'].includes(
                      overallFormData.stream
                    ) && (
                      <input
                        type="text"
                        value={overallFormData.stream}
                        onChange={(e) =>
                          setOverallFormData({ ...overallFormData, stream: e.target.value })
                        }
                        className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                        placeholder="Enter custom stream"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Centums Scored (100/100 subjects)
                  </label>
                  <input
                    type="number"
                    value={overallFormData.centums_scored}
                    onChange={(e) =>
                      setOverallFormData({ ...overallFormData, centums_scored: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {parseInt(overallFormData.centums_scored || '0', 10) > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-school-navy">
                      Centum Subjects ({overallFormData.centum_subjects.length}/
                      {overallFormData.centums_scored || 0})
                    </label>
                    <div className="mt-2 space-y-2">
                      {overallFormData.centum_subjects.map((subject, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => {
                              const newSubjects = [...overallFormData.centum_subjects];
                              newSubjects[idx] = e.target.value;
                              setOverallFormData({
                                ...overallFormData,
                                centum_subjects: newSubjects,
                              });
                            }}
                            className="flex-1 rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                            placeholder="Subject name"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSubjects = overallFormData.centum_subjects.filter(
                                (_, i) => i !== idx
                              );
                              setOverallFormData({
                                ...overallFormData,
                                centum_subjects: newSubjects,
                              });
                            }}
                            className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 transition-colors"
                            title="Remove subject"
                          >
                            <Icon name="trash" className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {overallFormData.centum_subjects.length <
                      parseInt(overallFormData.centums_scored || '0', 10) && (
                      <button
                        type="button"
                        onClick={() => {
                          setOverallFormData({
                            ...overallFormData,
                            centum_subjects: [...overallFormData.centum_subjects, ''],
                          });
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-school-gold/10 px-4 py-2 font-semibold text-school-gold transition-colors hover:bg-school-gold/20"
                      >
                        <Icon name="plus" className="h-4 w-4" />
                        Add Subject
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={overallFormData.academic_year}
                    onChange={(e) =>
                      setOverallFormData({ ...overallFormData, academic_year: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="2025-2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Student Photograph
                  </label>
                  <div className="mt-2 space-y-3">
                    {overallFormData.imagePreviewUrl && (
                      <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-school-navy/20">
                        <img
                          src={overallFormData.imagePreviewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setOverallFormData({
                              ...overallFormData,
                              imageFile: null,
                              imagePreviewUrl: null,
                              media_id: null,
                            });
                          }}
                          className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                          title="Remove image"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setOverallFormData({
                              ...overallFormData,
                              imageFile: file,
                              imagePreviewUrl: event.target?.result as string,
                              media_id: null,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-school-muted
                        file:rounded-lg file:border-0 file:bg-school-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-school-navy file:cursor-pointer hover:file:bg-school-gold-hover"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-school-gold px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
                  >
                    {editingTopperId ? 'Update Topper' : 'Add Topper'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddOverallForm(false);
                      setEditingTopperId(null);
                    }}
                    className="rounded-lg bg-white border border-school-navy/20 px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-cream"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Overall Toppers List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8 text-school-muted">Loading toppers...</div>
            ) : overallToppers.length === 0 ? (
              <div className="rounded-2xl border border-school-navy/10 bg-school-cream-alt p-8 text-center text-school-muted">
                No overall toppers added yet. Click "Add Overall Topper" to create one.
              </div>
            ) : (
              overallToppers
                .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                .map((topper) => (
                  <div
                    key={topper.id}
                    className="rounded-2xl border border-school-navy/10 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        {topper.media?.imageUrl && (
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-school-navy/10">
                            <img
                              src={topper.media.imageUrl}
                              alt={topper.student_name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block rounded-full bg-school-gold px-3 py-1 text-xs font-bold text-school-navy">
                              Rank {topper.rank}
                            </span>
                          </div>
                          <h4 className="font-serif text-lg font-bold text-school-navy">
                            {topper.student_name}
                          </h4>
                          <div className="mt-2 space-y-1 text-sm text-school-muted">
                            <div>
                              <span className="font-semibold text-school-navy">Score:</span>{' '}
                              {topper.score}
                            </div>
                            {activeGrade === '12' && topper.stream && (
                              <div>
                                <span className="font-semibold text-school-navy">Stream:</span>{' '}
                                {topper.stream}
                              </div>
                            )}
                            {topper.centums_scored > 0 && (
                              <div>
                                <span className="font-semibold text-school-navy">Centums:</span>{' '}
                                {topper.centums_scored}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-school-navy">Year:</span>{' '}
                              {topper.academic_year || 'N/A'}
                            </div>
                            {topper.centum_subjects && topper.centum_subjects.length > 0 && (
                              <div>
                                <span className="font-semibold text-school-navy">
                                  Centum Subjects:
                                </span>
                                <ul className="mt-1 ml-4 list-disc text-school-muted">
                                  {topper.centum_subjects.map((subject, idx) => (
                                    <li key={idx}>{subject}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOverallClick(topper)}
                          className="rounded-lg bg-school-gold/10 p-2 text-school-gold transition-colors hover:bg-school-gold/20"
                          title="Edit"
                        >
                          <Icon name="pencil" className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(topper.id)}
                          className="rounded-lg bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
                          title="Delete"
                        >
                          <Icon name="trash" className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* SUBJECT-WISE TOPPERS SECTION */}
      {activeTab === 'subject-wise' && (
        <div>
          {/* Add Button */}
          <div className="mb-8">
            <button
              onClick={handleAddSubjectClick}
              className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-gold-hover"
            >
              <Icon name="plus" className="h-5 w-5" />
              Add Subject-wise Topper
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddSubjectForm && (
            <div className="mb-8 rounded-2xl border border-school-navy/10 bg-white p-8">
              <h3 className="mb-6 font-serif text-xl font-bold text-school-navy">
                {editingSubjectTopperId ? 'Edit Subject-wise Topper' : 'Add Subject-wise Topper'}
              </h3>
              <form onSubmit={handleSubmitSubject} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.subject}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, subject: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.student_name}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, student_name: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="Enter student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Score (Obtained/Maximum) *
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.score}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, score: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="e.g., 100/100 or 98/100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.academic_year}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, academic_year: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="2025-2026"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Student Photograph
                  </label>
                  {subjectFormData.imagePreviewUrl && (
                    <div className="mt-2 mb-4">
                      <img
                        src={subjectFormData.imagePreviewUrl}
                        alt="Preview"
                        className="h-32 w-24 rounded-lg object-cover border-2 border-school-navy/10"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSubjectFormData({
                          ...subjectFormData,
                          imageFile: file,
                          imagePreviewUrl: URL.createObjectURL(file),
                        });
                      }
                    }}
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Class
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.class_name}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, class_name: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="e.g., HSC / XII, SSLC / X"
                  />
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-semibold text-school-navy">
                    Section
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.section}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, section: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                    placeholder="e.g., A, B, C"
                  />
                </div>

                {/* Stream - Only for Grade 12 */}
                {activeGrade === '12' && (
                  <div>
                    <label className="block text-sm font-semibold text-school-navy">
                      Stream (Grade 12 only)
                    </label>
                    <input
                      type="text"
                      value={subjectFormData.stream}
                      onChange={(e) =>
                        setSubjectFormData({ ...subjectFormData, stream: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                      placeholder="e.g., Computer Science, Bio-Maths, Commerce"
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-school-gold px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
                  >
                    {editingSubjectTopperId ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubjectForm(false);
                      setEditingSubjectTopperId(null);
                    }}
                    className="rounded-lg bg-white border border-school-navy/20 px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-cream"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subject-wise Toppers List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-school-muted">Loading toppers...</div>
            ) : subjectWiseToppers.length === 0 ? (
              <div className="rounded-2xl border border-school-navy/10 bg-school-cream-alt p-8 text-center text-school-muted">
                No subject-wise toppers added yet. Click "Add Subject-wise Topper" to create one.
              </div>
            ) : (
              <div className="rounded-2xl border border-school-navy/10 bg-white overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-school-navy/10 bg-school-cream">
                      <th className="text-left px-6 py-4 font-semibold text-school-navy">Subject</th>
                      <th className="text-left px-6 py-4 font-semibold text-school-navy">
                        Student Name
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-school-navy">Score</th>
                      <th className="text-left px-6 py-4 font-semibold text-school-navy">Year</th>
                      <th className="text-center px-6 py-4 font-semibold text-school-navy">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectWiseToppers.map((topper) => (
                      <tr
                        key={topper.id}
                        className="border-b border-school-navy/10 hover:bg-school-cream-alt transition-colors"
                      >
                        <td className="px-6 py-4 text-school-navy font-semibold">{topper.subject}</td>
                        <td className="px-6 py-4 text-school-navy">{topper.student_name}</td>
                        <td className="px-6 py-4 text-school-muted">{topper.score}</td>
                        <td className="px-6 py-4 text-school-muted">
                          {topper.academic_year || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditSubjectClick(topper)}
                              className="rounded-lg bg-school-gold/10 p-2 text-school-gold transition-colors hover:bg-school-gold/20"
                              title="Edit"
                            >
                              <Icon name="pencil" className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(topper.id)}
                              className="rounded-lg bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
                              title="Delete"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
