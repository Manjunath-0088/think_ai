import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getEnrollmentById } from "../../api/enrollmentApi";
import {
  getProgressByEnrollment,
  getProgressSummary,
} from "../../api/lessonProgressApi";
import {
  generateCertificate,
  getCertificateByEnrollment,
  downloadCertificateUrl,
} from "../../api/certificateApi";
import { DetailsSkeleton } from "../../components/common/LoadingSkeleton";

function EnrollmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);

  const [certificate, setCertificate] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadEnrollment();
    loadProgress();
    loadCertificate();
  }, [id]);

  const loadEnrollment = async () => {
    try {
      setLoading(true);
      const response = await getEnrollmentById(id);
      setEnrollment(response.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load enrollment");
      setEnrollment(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      setProgressLoading(true);
      const [progressRes, summaryRes] = await Promise.all([
        getProgressByEnrollment(id),
        getProgressSummary(id),
      ]);
      setProgress(progressRes.data.data || []);
      setSummary(summaryRes.data.data || null);
    } catch (error) {
      console.error(error);
      // Non-blocking: enrollment details still render without progress.
    } finally {
      setProgressLoading(false);
    }
  };

  const loadCertificate = async () => {
    try {
      setCertificateLoading(true);
      const response = await getCertificateByEnrollment(id);
      setCertificate(response.data.data || null);
    } catch (error) {
      // 404 just means "not issued yet" — treat as no certificate, not an error.
      if (error.response?.status !== 404) {
        console.error(error);
      }
      setCertificate(null);
    } finally {
      setCertificateLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);
      const response = await generateCertificate(id);
      setCertificate(response.data.data);
      toast.success("Certificate generated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Certificate not available yet");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (!enrollment) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="text-cyan-400 text-xl font-semibold animate-pulse">
          Loading Enrollment...
        </div>
      </div>
    );
  }

  const completedCount =
    summary?.completedLessons ?? progress.filter((p) => p.completed).length;
  const totalCount = summary?.totalLessons ?? progress.length;
  const percent =
    summary?.percentComplete ??
    (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Enrollment Overview</h1>
          <p className="text-sm text-gray-400 mt-1">View complete student enrollment information.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/enrollments/edit/${enrollment.id}`}
            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Edit Enrollment
          </Link>
        </div>
      </div>

      <div className="bg-[#112435] border border-gray-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-cyan-500/20 border-2 border-teal-600 flex items-center justify-center text-3xl font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-center p-4">
              {(enrollment.studentName || 'S').charAt(0).toUpperCase()}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide border ${
              enrollment.enrollmentStatus === "ACTIVE"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {enrollment.enrollmentStatus}
            </span>
          </div>

          <div className="flex-1 w-full space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Student Name</p>
              <p className="text-lg font-medium text-white">{enrollment.studentName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Student Email</p>
              <p className="text-lg text-white">{enrollment.studentEmail}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Assigned Batch</p>
              <p className="text-lg text-cyan-400 font-medium">{enrollment.batch?.name || "N/A"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/60">
              <div>
                <p className="text-sm text-gray-400 mb-1">Associated Course</p>
                <p className="text-white text-sm">{enrollment.batch?.course?.title || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Enrolled On</p>
                <p className="text-white text-sm">
                  {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Progress (read-only) */}
      <div className="bg-[#112435] border border-gray-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Lesson Progress</h2>
            <p className="text-sm text-gray-400 mt-1">Auto-tracked as the student completes lessons.</p>
          </div>
          {!progressLoading && totalCount > 0 && (
            <span className="text-sm font-semibold text-cyan-400">
              {completedCount}/{totalCount} · {percent}%
            </span>
          )}
        </div>

        {progressLoading ? (
          <div className="text-sm text-gray-500 animate-pulse">Loading progress...</div>
        ) : totalCount === 0 ? (
          <div className="text-sm text-gray-500 border-2 border-dashed border-gray-800 rounded-xl py-8 text-center">
            No lesson progress recorded yet.
          </div>
        ) : (
          <>
            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>

            <ul className="space-y-2 max-h-80 overflow-auto custom-scrollbar pr-1">
              {progress.map((p) => (
                <li
                  key={p.lessonId}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-gray-800/60"
                >
                  <span className="text-sm text-gray-200">
                    {p.lesson?.title || `Lesson #${p.lessonId}`}
                  </span>
                  {p.completed ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-white/[0.03] border border-gray-700 px-2.5 py-1 rounded-md">
                      Pending
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Certificate */}
      <div className="bg-[#112435] border border-gray-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Certificate</h2>
            <p className="text-sm text-gray-400 mt-1">Issued once the course is fully completed.</p>
          </div>
        </div>

        {certificateLoading ? (
          <div className="text-sm text-gray-500 animate-pulse">Checking certificate status...</div>
        ) : certificate ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 rounded-xl bg-white/[0.02] border border-gray-800/60">
            <div>
              <p className="text-sm text-gray-400 mb-1">Certificate No.</p>
              <p className="text-white font-medium">{certificate.certificateNo}</p>
              {certificate.issuedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Issued {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <a
              href={downloadCertificateUrl(certificate.certificateNo)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors text-center shrink-0"
            >
              Download Certificate
            </a>
          </div>
        ) : totalCount > 0 && percent >= 100 ? (
          // Edge case: every lesson is complete but no certificate came through yet.
          // Certificates normally issue automatically on the last lesson completion,
          // so this fallback is only for retrying after a backend hiccup.
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 rounded-xl border-2 border-dashed border-amber-500/30">
            <p className="text-sm text-amber-400">
              Course complete, but the certificate hasn't been issued yet.
            </p>
            <button
              onClick={handleGenerateCertificate}
              disabled={generating}
              className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-white border-0 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {generating ? "Generating..." : "Retry Generate"}
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 rounded-xl border-2 border-dashed border-gray-800">
            <p className="text-sm text-gray-500">
              Issued automatically once the student completes every lesson.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnrollmentDetails;