import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

import {
  fetchAssessmentById,
  submitAssessmentAnswers,
  clearCurrentAssessment,
  selectCurrentAssessment,
  selectAssessmentsLoading,
  selectAssessmentSubmitting,
  selectSubmitResult,
  selectAssessmentError,
  clearAssessmentError,
} from "../../features/assessments/assessmentSlice";

// enrollmentId still isn't available from the route (see note below) —
// accepted as a prop for now so this keeps working when embedded
// elsewhere with it passed in directly.
export default function StudentAssessmentTaker({ enrollmentId, onDone }) {
  const { assessmentId } = useParams();
  const dispatch = useDispatch();

  const assessment = useSelector(selectCurrentAssessment);
  const loading = useSelector(selectAssessmentsLoading);
  const submitting = useSelector(selectAssessmentSubmitting);
  const submitResult = useSelector(selectSubmitResult);
  const error = useSelector(selectAssessmentError);

  // { [questionId]: selectedOptionId }
  const [answers, setAnswers] = useState({});

  // --- Every hook call lives here, unconditionally, before any return ---

  useEffect(() => {
    if (assessmentId) {
      dispatch(fetchAssessmentById(assessmentId));
    }
    return () => {
      dispatch(clearCurrentAssessment());
    };
  }, [assessmentId, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error, { theme: "dark" });
      dispatch(clearAssessmentError());
    }
  }, [error, dispatch]);

  // --- No hooks below this line ---

  const handleSelect = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const allAnswered =
    assessment?.questions?.length > 0 &&
    assessment.questions.every((q) => answers[q.id] != null);

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting", { theme: "dark" });
      return;
    }

    if (!enrollmentId) {
      toast.error("Missing enrollment context — cannot submit", { theme: "dark" });
      return;
    }

    const payloadAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId: Number(questionId),
      selectedOptionId: Number(selectedOptionId),
    }));

    try {
      await dispatch(
        submitAssessmentAnswers({
          assessmentId,
          enrollmentId,
          answers: payloadAnswers,
        })
      ).unwrap();
      toast.success("Assessment submitted successfully", { theme: "dark" });
    } catch (err) {
      toast.error(err?.message || "Failed to submit assessment", { theme: "dark" });
    }
  };

  if (!assessmentId) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        No assessment selected.
      </div>
    );
  }

  if (loading && !assessment) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 size={16} className="animate-spin" /> Loading assessment…
      </div>
    );
  }

  if (!assessment) return null;

  // Post-submission result view
  if (submitResult) {
    const passed = submitResult.percentage >= 40;
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 p-8 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800 shadow-2xl">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            passed ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
          }`}
        >
          {passed ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
        </div>
        <h3 className="text-xl font-bold">
          {passed ? "Assessment Passed" : "Assessment Not Passed"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Score: {submitResult.score} / {submitResult.totalMarks} (
          {submitResult.percentage?.toFixed(1)}%)
        </p>
        <button
          onClick={onDone}
          className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg cursor-pointer"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold">{assessment.title}</h2>
        {assessment.description && (
          <p className="text-sm text-slate-500 mt-1">{assessment.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-2">
          <span>Total Marks: {assessment.totalMarks}</span>
          {assessment.duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {assessment.duration} mins
            </span>
          )}
        </div>
      </div>

      {assessment.questions.map((q, index) => (
        <div
          key={q.id}
          className="p-5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
        >
          <p className="text-sm font-semibold">
            {index + 1}. {q.questionText}{" "}
            <span className="text-xs text-slate-400 font-mono">({q.marks} marks)</span>
          </p>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs transition ${
                  answers[q.id] === opt.id
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  checked={answers[q.id] === opt.id}
                  onChange={() => handleSelect(q.id, opt.id)}
                  className="accent-emerald-600"
                />
                {opt.optionText}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        Submit Assessment
      </button>
    </div>
  );
}