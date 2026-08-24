import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getEnrollments, deleteEnrollment } from "../../api/enrollmentApi";
import { EnrollmentListSkeleton } from "../../components/common/LoadingSkeleton";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const STATUS_STYLES = {
  ENROLLED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  COMPLETED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function EnrollmentList() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [confirmState, setConfirmState] = useState({ open: false, enrollmentId: null });

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await getEnrollments();
      setEnrollments(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enr) => {
      const matchesSearch =
        enr.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        enr.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
        enr.batch?.name?.toLowerCase().includes(search.toLowerCase()) ||
        enr.batch?.course?.title?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || enr.enrollmentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, enrollments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentEnrollments = filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);

  const handleDeleteConfirmed = async () => {
    try {
      await deleteEnrollment(confirmState.enrollmentId);
      toast.success("Enrollment deleted successfully");
      fetchEnrollments();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to delete enrollment"
      );
    } finally {
      setConfirmState({ open: false, enrollmentId: null });
    }
  };

  if (loading) {
    return <EnrollmentListSkeleton />;
  }

  return (
    <div className="relative flex flex-col h-full space-y-4 sm:space-y-6 -mt-2 overflow-hidden pb-2">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-white">Enrollment Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage student enrollments and records.</p>
        </div>
        <div className="shadow-[0_0_20px_rgba(168,85,247,0.3)] rounded-xl">
          <Link
            to="/admin/enrollments/add"
            className="px-6 py-3 text-base font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-white border-0 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 inline-block"
          >
            + Add Enrollment
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col glass-panel rounded-2xl p-4 sm:p-6 space-y-4 min-h-0 bg-[#1A1F2B] border border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end shrink-0">
          <div className="max-w-sm shrink-0 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="name / batch / course"
              className="w-full bg-black/20 border border-purple-500/30 text-purple-100 placeholder-purple-50/30 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg px-8 py-2 text-sm outline-none transition-all shadow-inner"
            />
            <svg className="absolute right-3 top-2.5 h-4 w-4 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'ENROLLED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === status
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-gray-400 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                  }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0 rounded-xl relative">
          {/* Desktop/tablet: table */}
          <table className="hidden md:table w-full text-sm border border-gray-800/60 rounded-xl">
            <thead className="sticky top-0 bg-[#151025] z-10 shadow-md">
              <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                <th className="p-4 font-medium uppercase tracking-wider">ID</th>
                <th className="p-4 font-medium uppercase tracking-wider">Student Name</th>
                <th className="p-4 font-medium uppercase tracking-wider hidden lg:table-cell">Email</th>
                <th className="p-4 font-medium uppercase tracking-wider">Batch</th>
                <th className="p-4 font-medium uppercase tracking-wider hidden lg:table-cell">Course</th>
                <th className="p-4 font-medium uppercase tracking-wider">Status</th>
                <th className="p-4 font-medium uppercase tracking-wider hidden xl:table-cell">Enrolled On</th>
                <th className="p-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEnrollments.map((enrollment) => {
                const batch = enrollment.batch;
                const course = batch?.course;

                return (
                  <tr key={enrollment.id} className="border-b border-slate-800/60 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-gray-300 font-medium">{enrollment.id}</td>
                    <td className="p-4 text-gray-200 font-medium">{enrollment.studentName}</td>
                    <td className="p-4 text-gray-400 hidden lg:table-cell">{enrollment.studentEmail}</td>
                    <td className="p-4 text-cyan-400 font-medium">{batch?.name || "-"}</td>
                    <td className="p-4 text-gray-300 hidden lg:table-cell">{course?.title || "-"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border whitespace-nowrap ${STATUS_STYLES[enrollment.enrollmentStatus] || STATUS_STYLES.ENROLLED}`}>
                        {enrollment.enrollmentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 hidden xl:table-cell">
                      {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/enrollments/${enrollment.id}`}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all uppercase tracking-wider font-semibold"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/enrollments/edit/${enrollment.id}`}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all uppercase tracking-wider font-semibold"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setConfirmState({ open: true, enrollmentId: enrollment.id })}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all uppercase tracking-wider font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEnrollments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                    <p className="text-sm tracking-widest uppercase mt-4">No enrollments match your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {currentEnrollments.map((enrollment) => {
              const batch = enrollment.batch;
              const course = batch?.course;

              return (
                <div key={enrollment.id} className="rounded-xl border border-gray-800/60 bg-[#151025] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{enrollment.studentName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{enrollment.studentEmail}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase border ${STATUS_STYLES[enrollment.enrollmentStatus] || STATUS_STYLES.ENROLLED}`}>
                      {enrollment.enrollmentStatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    <span className="text-cyan-400 font-medium">{batch?.name || "-"}</span>
                    {course?.title && <span> · {course.title}</span>}
                  </div>

                  <p className="text-xs text-gray-500">
                    Enrolled {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "-"}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800/60">
                    <Link
                      to={`/admin/enrollments/${enrollment.id}`}
                      className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-cyan-400 uppercase tracking-wider font-semibold"
                    >
                      View
                    </Link>
                    <Link
                      to={`/admin/enrollments/edit/${enrollment.id}`}
                      className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-purple-400 uppercase tracking-wider font-semibold"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setConfirmState({ open: true, enrollmentId: enrollment.id })}
                      className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-rose-400 uppercase tracking-wider font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredEnrollments.length === 0 && (
              <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                <p className="text-sm tracking-widest uppercase">No enrollments match your search.</p>
              </div>
            )}
          </div>
        </div>

        {totalPages > 0 && (
          <div className="shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 mt-2 pt-4 border-t border-gray-800/60">
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              Showing <strong className="text-gray-300">{indexOfFirstItem + 1}</strong> to <strong className="text-gray-300">{Math.min(indexOfLastItem, filteredEnrollments.length)}</strong> of <strong className="text-gray-300">{filteredEnrollments.length}</strong> enrollments
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/[0.02] border border-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] hover:border-gray-500 transition-all text-xs font-bold uppercase tracking-wider"
              >
                Prev
              </button>
              <div className="flex items-center px-4 py-2 rounded-lg bg-black/20 border border-gray-800 text-xs font-bold text-gray-400">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/[0.02] border border-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] hover:border-gray-500 transition-all text-xs font-bold uppercase tracking-wider"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title="Confirm Delete"
        message="Are you sure you want to delete this enrollment? This action cannot be undone."
        danger={true}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmState({ open: false, enrollmentId: null })}
      />
    </div>
  );
}