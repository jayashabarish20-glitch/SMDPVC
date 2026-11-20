import { useState } from 'react';
import type { Topper } from '../../hooks/useToppers';
import { useAdminToppers } from '../../hooks/useToppers';
import { uploadImage } from '../../services/mediaUploadApi';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';

interface TopperFormData {
  student_name: string;
  score: string;
  stream: string;
  centums_scored: string;
  centum_subjects: string[];
  academic_year: string;
  media_id: string | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}

export function ToppersManager() {
  const [activeGrade, setActiveGrade] = useState<'12' | '10'>('12');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTopperId, setEditingTopperId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TopperFormData>({
    student_name: '',
    score: '',
    stream: '',
    centums_scored: '',
    centum_subjects: [],
    academic_year: new Date().getFullYear().toString(),
    media_id: null,
    imageFile: null,
    imagePreviewUrl: null,
  });

  const { toppers, loading, addTopper, updateTopper, deleteTopper } =
    useAdminToppers(activeGrade === '12' ? '12' : '10');

  const currentToppers = toppers.filter(
    (t) => t.grade_level === (activeGrade === '12' ? '12' : '10')
  );

  const handleAddClick = () => {
    setFormData({
      student_name: '',
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
    setShowAddForm(true);
  };

  const handleEditClick = (topper: Topper) => {
    setFormData({
      student_name: topper.student_name,
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
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.student_name || !formData.score || !formData.centums_scored) {
      alert('Please fill in all required fields');
      return;
    }

    const centumScore = parseInt(formData.centums_scored, 10);
    if (formData.centum_subjects.length !== centumScore) {
      alert(`Number of centum subjects (${formData.centum_subjects.length}) must match Centums Scored (${centumScore})`);
      return;
    }

    try {
      let mediaId = formData.media_id;

      // Upload image if a new one was selected
      if (formData.imageFile) {
        const uploadedMedia = await uploadImage(formData.imageFile, formData.student_name);
        mediaId = uploadedMedia.id;
      }

      const topperData = {
        student_name: formData.student_name,
        grade_level: activeGrade === '12' ? '12' : '10',
        academic_year: formData.academic_year,
        score: formData.score,
        stream: formData.stream,
        centums_scored: centumScore,
        centum_subjects: formData.centum_subjects,
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

      setShowAddForm(false);
      setFormData({
        student_name: '',
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
        badge="HIGHER SECONDARY"
        title="School Toppers Management"
        description="Manage Class XII and Class X toppers. Add, edit, or delete topper records."
      />

      {/* Grade Tabs */}
      <div className="mb-8 flex gap-4">
        {(['12', '10'] as const).map((grade) => (
          <button
            key={grade}
            onClick={() => {
              setActiveGrade(grade);
              setShowAddForm(false);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeGrade === grade
                ? 'bg-school-navy text-white'
                : 'bg-white text-school-navy border border-school-navy/20'
            }`}
          >
            Class {grade} Toppers
          </button>
        ))}
      </div>

      {/* Add Topper Button */}
      <div className="mb-8">
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-gold-hover"
        >
          <Icon name="plus" className="h-5 w-5" />
          Add {activeGrade === '12' ? 'Class XII' : 'Class X'} Topper
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-8 rounded-2xl border border-school-navy/10 bg-white p-8">
          <h3 className="mb-6 font-serif text-xl font-bold text-school-navy">
            {editingTopperId ? 'Edit Topper' : `Add ${activeGrade === '12' ? 'Class XII' : 'Class X'} Topper`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Student Name *
              </label>
              <input
                type="text"
                value={formData.student_name}
                onChange={(e) =>
                  setFormData({ ...formData, student_name: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Total Marks/Score *
              </label>
              <input
                type="text"
                value={formData.score}
                onChange={(e) =>
                  setFormData({ ...formData, score: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                placeholder="e.g., 585/600"
              />
            </div>

            {activeGrade === '12' && (
              <div>
                <label className="block text-sm font-semibold text-school-navy">
                  Stream Studied
                </label>
                <input
                  type="text"
                  value={formData.stream}
                  onChange={(e) =>
                    setFormData({ ...formData, stream: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                  placeholder="e.g., Computer Science, Bio-Maths"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Centums Scored (100/100 subjects) *
              </label>
              <input
                type="number"
                value={formData.centums_scored}
                onChange={(e) =>
                  setFormData({ ...formData, centums_scored: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Centum Subjects ({formData.centum_subjects.length}/{formData.centums_scored || 0})
              </label>
              <div className="mt-2 space-y-2">
                {formData.centum_subjects.map((subject, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => {
                        const newSubjects = [...formData.centum_subjects];
                        newSubjects[idx] = e.target.value;
                        setFormData({ ...formData, centum_subjects: newSubjects });
                      }}
                      className="flex-1 rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                      placeholder="Subject name"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSubjects = formData.centum_subjects.filter((_, i) => i !== idx);
                        setFormData({ ...formData, centum_subjects: newSubjects });
                      }}
                      className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 transition-colors"
                      title="Remove subject"
                    >
                      <Icon name="trash" className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.centums_scored && formData.centum_subjects.length < parseInt(formData.centums_scored, 10) && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      centum_subjects: [...formData.centum_subjects, ''],
                    });
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-school-gold/10 px-4 py-2 font-semibold text-school-gold transition-colors hover:bg-school-gold/20"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Subject
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) =>
                  setFormData({ ...formData, academic_year: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy focus:border-school-gold focus:outline-none"
                placeholder="2025-2026"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Topper Photograph {!editingTopperId && '*'}
              </label>
              <div className="mt-2 space-y-3">
                {formData.imagePreviewUrl && (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-school-navy/20">
                    <img
                      src={formData.imagePreviewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
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
                        setFormData({
                          ...formData,
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
                  setShowAddForm(false);
                  setEditingTopperId(null);
                  setFormData({
                    student_name: '',
                    score: '',
                    stream: '',
                    centums_scored: '',
                    centum_subjects: [],
                    academic_year: new Date().getFullYear().toString(),
                    media_id: null,
                    imageFile: null,
                    imagePreviewUrl: null,
                  });
                }}
                className="rounded-lg bg-white border border-school-navy/20 px-6 py-3 font-semibold text-school-navy transition-colors hover:bg-school-cream"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toppers List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-school-muted">
            Loading toppers...
          </div>
        ) : currentToppers.length === 0 ? (
          <div className="rounded-2xl border border-school-navy/10 bg-school-cream-alt p-8 text-center text-school-muted">
            No {activeGrade === '12' ? 'Class XII' : 'Class X'} toppers added yet.
            Click "Add Topper" to create one.
          </div>
        ) : (
          currentToppers.map((topper) => (
            <div
              key={topper.id}
              className="rounded-2xl border border-school-navy/10 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {topper.media?.imageUrl && (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-school-navy/10">
                      <img
                        src={topper.media.imageUrl}
                        alt={topper.student_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-serif text-lg font-bold text-school-navy">
                      {topper.student_name}
                    </h4>
                  <div className="mt-2 space-y-2 text-sm text-school-muted">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                      <div>
                        <span className="font-semibold text-school-navy">Centums:</span>{' '}
                        {topper.centums_scored}
                      </div>
                      <div>
                        <span className="font-semibold text-school-navy">Year:</span>{' '}
                        {topper.academic_year || 'N/A'}
                      </div>
                    </div>
                    {topper.centum_subjects && topper.centum_subjects.length > 0 && (
                      <div>
                        <span className="font-semibold text-school-navy">Centum Subjects:</span>
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
                    onClick={() => handleEditClick(topper)}
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
  );
}
