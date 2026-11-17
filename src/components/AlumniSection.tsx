import { useState, useEffect, useMemo } from 'react';

interface Alumni {
  id: string;
  name: string;
  batch_year: string;
  description: string;
  display_order: number;
  is_published: boolean;
  media_id: string | null;
  media?: { id: string; image_url: string; alt_text: string } | null;
}

const ITEMS_PER_PAGE = 12;

export function AlumniSection() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBatch, setFilterBatch] = useState('');
  const [sortBy, setSortBy] = useState<'batch_year' | 'name'>('batch_year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/alumni');
        if (!response.ok) throw new Error('Failed to load alumni');
        const data = await response.json();
        setAlumni(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alumni');
        console.error('Error loading alumni:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  // Get unique batch years for filter
  const batchYears = useMemo(() => {
    return Array.from(new Set(alumni.map((a) => a.batch_year)))
      .map((year) => parseInt(year) || 0)
      .filter((year) => year > 0)
      .sort()
      .reverse();
  }, [alumni]);

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let result = alumni.filter((alum) => {
      const matchesBatch = filterBatch === '' || alum.batch_year === filterBatch;
      return matchesBatch;
    });

    result.sort((a, b) => {
      let aVal: string | number = a[sortBy];
      let bVal: string | number = b[sortBy];

      if (sortBy === 'batch_year') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [alumni, filterBatch, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedAlumni = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  if (loading) {
    return <p className="text-center text-school-muted py-12">Loading alumni profiles...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 py-12">Failed to load alumni profiles</p>;
  }

  if (alumni.length === 0) {
    return <p className="text-center text-school-muted py-12">No alumni profiles available yet.</p>;
  }

  return (
    <div className="mt-6">
      {/* Filter and Sort Controls */}
      {batchYears.length > 1 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={filterBatch}
            onChange={(e) => {
              setFilterBatch(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-school-navy/15 px-3 py-2 text-sm focus:border-school-gold focus:outline-none"
          >
            <option value="">All Batches</option>
            {batchYears.map((year) => (
              <option key={year} value={String(year)}>
                Batch {year}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'batch_year' | 'name');
                setCurrentPage(1);
              }}
              className="rounded-lg border border-school-navy/15 px-3 py-2 text-sm focus:border-school-gold focus:outline-none"
            >
              <option value="batch_year">Sort by Batch</option>
              <option value="name">Sort by Name</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-lg border border-school-navy/15 px-3 py-2 text-sm font-medium hover:bg-school-cream"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      )}

      {/* Alumni Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedAlumni.map((alum) => (
          <div
            key={alum.id}
            className="rounded-2xl border border-school-navy/8 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {alum.media && (
              <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-school-cream-alt">
                <img
                  src={alum.media.image_url}
                  alt={alum.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <h3 className="font-serif text-lg font-bold text-school-navy">{alum.name}</h3>
            <p className="mt-1 text-sm text-school-muted">Batch {alum.batch_year}</p>
            {alum.description && (
              <p className="mt-3 text-sm leading-relaxed text-school-navy line-clamp-3">{alum.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="text-sm text-school-muted">
            Showing {paginatedAlumni.length} of {filteredAndSorted.length} alumni
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-school-navy/15 px-4 py-2 text-sm font-medium text-school-navy hover:bg-school-cream disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 text-sm text-school-muted">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-school-navy/15 px-4 py-2 text-sm font-medium text-school-navy hover:bg-school-cream disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty filter message */}
      {filteredAndSorted.length === 0 && alumni.length > 0 && (
        <p className="text-center text-school-muted py-8">
          No alumni found for the selected filter.
        </p>
      )}
    </div>
  );
}
