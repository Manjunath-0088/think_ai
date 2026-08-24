import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import CourseCard from './CourseCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';

export default function CourseList({
  courses,
  loading,
  error,
  search,
  setSearch,
  currentPage,
  setCurrentPage,
  hasNextPage,
  onEdit,
  onDelete,
  onView,
  onRetry,
}) {
  const user = useSelector(selectUser);
  
  // Check if current user has admin privileges
  const isAdmin = user?.role === 'Admin' || user?.role === 'ADMIN' || user?.isAdmin;

  // Sort courses by ID in ascending order
  const sortedCourses = Array.isArray(courses) ? [...courses].sort((a, b) => (a.id || 0) - (b.id || 0)) : [];

  return (
    <div className="relative z-10 w-full bg-[#131824] backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-purple-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] space-y-6">
      
      {/* Search Input */}
      <div className="max-w-sm relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course name..."
          className="w-full bg-[#0b0e14] border border-slate-700 text-purple-100 placeholder-slate-500 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg px-4 py-2.5 text-sm outline-none transition-all shadow-inner"
        />
        <svg className="absolute right-3 top-3 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <LoadingSpinner label="Loading courses..." className="text-purple-400" />
        </div>
      )}

      {!loading && error && (
        <div className="py-20 flex items-center justify-center">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedCourses.map((c) => (
              <CourseCard 
                key={c.id || c._id} 
                course={c} 
                isAdmin={isAdmin} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onView={onView} 
              />
            ))}
            
            {sortedCourses.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-[#0b0e14]/40">
                <p className="text-slate-400 text-xs tracking-widest uppercase">No courses found.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {(currentPage > 1 || hasNextPage) && (
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-[#0b0e14] border border-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-900/30 transition-all text-xs font-semibold cursor-pointer"
              >
                &larr; Prev
              </button>
              <span className="text-slate-400 text-xs font-medium tracking-wider uppercase">
                Page <strong className="text-white">{currentPage}</strong>
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 rounded-lg bg-[#0b0e14] border border-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-900/30 transition-all text-xs font-semibold cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}