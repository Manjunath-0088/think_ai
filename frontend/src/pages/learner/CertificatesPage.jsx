import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import {
  fetchMyEnrollments,
  selectMyEnrollments,
  selectEnrollmentLoading,
  selectEnrollmentError,
} from '../../features/enrollments/enrollmentSlice';
import {
  fetchCertificateEligibility,
  fetchCertificateByEnrollment,
  selectEligibilityFor,
  selectCertificateForEnrollment,
} from '../../features/certificates/certificateSlice';
import { downloadCertificateUrl } from '../../api/certificateApi';
import { Award, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';

function CertificateRow({ enrollment }) {
  const dispatch = useDispatch();
  const enrollmentId = enrollment.id;
  const course = enrollment.batch?.course;

  const eligibility = useSelector(selectEligibilityFor(enrollmentId));
  const certificate = useSelector(selectCertificateForEnrollment(enrollmentId));

  useEffect(() => {
    dispatch(fetchCertificateEligibility(enrollmentId));
    dispatch(fetchCertificateByEnrollment(enrollmentId));
  }, [dispatch, enrollmentId]);

  const isEligible = eligibility?.eligible ?? false;
  const courseProgress = eligibility?.courseProgress?.completionPercentage ?? 0;
  const assessmentsPassed = eligibility?.assessments?.requirementMet ?? false;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-xl space-y-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Course Certificate Pathway
          </span>
          <h3 className="text-lg font-bold font-fraunces mt-1.5 text-slate-900 dark:text-white">
            {course?.title || 'Enrolled Course Pathway'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Student: {enrollment.studentName} ({enrollment.studentEmail})
          </p>
        </div>

        {certificate ? (
          <a
            href={downloadCertificateUrl(certificate.certificateNo)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Download size={14} /> Download Certificate PDF
          </a>
        ) : isEligible ? (
          <div className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Ready (Backend Auto-Issued)
          </div>
        ) : (
          <div className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1.5">
            <AlertCircle size={14} /> Requirements Pending
          </div>
        )}
      </div>

      {/* Compliance Telemetry breakdown grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          courseProgress >= 80 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
          <span>Video Watch Progress (&ge;80% required)</span>
          <span className="font-mono font-bold">{courseProgress}%</span>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          assessmentsPassed 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
          <span>Required Assessments Passed (&ge;40%)</span>
          <span className="font-mono font-bold">
            {eligibility ? `${eligibility.assessments.passed} / ${eligibility.assessments.total}` : 'Checking...'}
          </span>
        </div>
      </div>

      {certificate && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Certificate Number: <strong className="text-slate-700 dark:text-slate-200">{certificate.certificateNo}</strong></span>
          <span>Issued: {new Date(certificate.issuedAt || certificate.createdAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}

export default function CertificatesPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const enrollments = useSelector(selectMyEnrollments);
  const loading = useSelector(selectEnrollmentLoading);
  const error = useSelector(selectEnrollmentError);

  useEffect(() => {
    if (user?.email) {
      dispatch(fetchMyEnrollments(user.email));
    }
  }, [dispatch, user?.email]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 font-mono text-xs">
        <Loader2 className="animate-spin mr-2 text-emerald-500" size={16} /> Loading enrollments...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600 font-mono text-center">{error}</div>;
  }

  if (enrollments.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-2">
        <Award size={36} className="mx-auto text-slate-400 opacity-50" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Course Enrollments Found</p>
        <p className="text-xs text-slate-500">You are not enrolled in any active course batches yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12" style={{ fontFamily: "Inter, sans-serif" }}>
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          Credentials Hub
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-fraunces mt-2">Course Certificates</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Verify your eligibility and download automated certificates upon meeting curriculum standards.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {enrollments.map((e) => (
          <CertificateRow key={e.id} enrollment={e} />
        ))}
      </div>
    </div>
  );
}