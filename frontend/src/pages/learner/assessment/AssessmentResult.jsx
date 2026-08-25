import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AssessmentResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const submission = state?.submission;
  const title = state?.title;

  if (!submission) {
    // Direct nav / refresh with no state — bounce back
    navigate("/learner/assessments", { replace: true });
    return null;
  }

  const passed = submission.percentage >= 40;

  return (
    <div className="max-w-xl mx-auto text-center space-y-4 p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
        passed ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
      }`}>
        {passed ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
      </div>
      <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Score: {submission.score} / {submission.totalMarks} ({submission.percentage?.toFixed(1)}%)
      </p>
      <button
        onClick={() => navigate("/learner/assessments")}
        className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-pointer"
      >
        Back to Assignments
      </button>
    </div>
  );
}