import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getEnrollments } from '../../../api/enrollmentApi';
import { getEnrollmentAssessmentStatus } from '../../../api/assessmentApi';

// adjust to wherever your mock auth actually stores the logged-in user
import { selectUser  } from '../../../features/auth/authSlice';

const STATUS_STYLES = {
  pending: 'bg-[var(--accent-to)]/15 text-[var(--accent-to)]',
  passed: 'bg-[var(--success)]/15 text-[var(--success)]',
  failed: 'bg-[var(--danger)]/15 text-[var(--danger)]',
};

function deriveStatus(a) {
  if (!a.attempted) return 'pending';
  return a.passed ? 'passed' : 'failed';
}

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser); 

  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    (async () => {
      try {
        // 1. Get all enrollments, filter to this mock user's email
        const enrollRes = await getEnrollments();
        const allEnrollments = enrollRes.data.data || enrollRes.data || [];
        const myEnrollments = allEnrollments.filter(
          (e) => e.studentEmail === user.email
        );

        if (myEnrollments.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        // 2. Fetch assessment status per enrollment, in parallel
        const statuses = await Promise.all(
          myEnrollments.map((e) =>
            getEnrollmentAssessmentStatus(e.id)
              .then((res) => ({ enrollment: e, status: res.data.data }))
              .catch(() => ({ enrollment: e, status: null }))
          )
        );

        // 3. Merge into a flat list, tagging each assessment with its enrollmentId
        const merged = statuses.flatMap(({ enrollment, status }) =>
          (status?.assessments || []).map((a) => ({
            ...a,
            enrollmentId: enrollment.id,
            courseTitle: enrollment.course?.title || enrollment.batch?.course?.title || null,
          }))
        );

        if (!cancelled) setItems(merged);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }
  if (!items) {
    return <div className="p-6 text-sm text-neutral-400">Loading assignments…</div>;
  }
  if (items.length === 0) {
    return <div className="p-6 text-sm text-neutral-400">No assignments yet.</div>;
  }

  const totalPassed = items.filter((a) => a.passed).length;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Assignments</h1>
        <span className="text-xs text-[var(--text-muted)]">
          {totalPassed} / {items.length} passed
        </span>
      </div>

      {items.map((a) => {
        const s = deriveStatus(a);
        return (
          <div
            key={`${a.enrollmentId}-${a.assessmentId}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{a.title}</p>
                {a.courseTitle && (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{a.courseTitle}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[s]}`}
              >
                {s}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">
                {a.attempted ? `Score: ${a.percentage?.toFixed(1)}%` : 'Not attempted yet'}
              </p>

              {s !== 'passed' && (
                <button
                  onClick={() =>
                    navigate(`/learner/assessments/${a.assessmentId}`, {
                      state: { enrollmentId: a.enrollmentId },
                    })
                  }
                  className="text-xs font-semibold text-[var(--accent-to)] hover:underline cursor-pointer"
                >
                  {a.attempted ? 'Retake' : 'Start'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}