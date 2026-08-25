import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getAssessmentById, submitAssessment } from "../../../api/assessmentApi";

/**
 * Route assumption: /learner/assessments/:id
 * The enrollment this attempt counts against is expected to arrive via
 * navigation state (from wherever the "Start Assessment" link lives, e.g.
 * a course/module page that already knows the learner's enrollmentId):
 *
 *   navigate(`/learner/assessments/${assessment.id}`, { state: { enrollmentId } })
 *
 * Swap this for however your app actually tracks the active enrollment
 * (redux, auth context, etc.) if it's not passed this way.
 */
function TakeAssessment() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const enrollmentId = location.state?.enrollmentId;

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionId }
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!enrollmentId) {
      toast.error("Missing enrollment context for this attempt", { theme: "dark" });
      navigate(-1);
      return;
    }
    loadAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await getAssessmentById(id);
      const data = response.data.data;
      setAssessment(data);
      if (data.duration) setSecondsLeft(data.duration * 60);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assessment", { theme: "dark" });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Countdown + auto-submit
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!submittedRef.current) {
        toast.info("Time's up — submitting your answers", { theme: "dark" });
        handleSubmit();
      }
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const formattedTime = useMemo(() => {
    if (secondsLeft === null) return null;
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  const selectOption = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessment?.questions?.length || 0;

  const handleSubmit = async () => {
    if (submittedRef.current) return;

    if (!submitting && answeredCount < totalQuestions) {
      const proceed = window.confirm(
        `You've answered ${answeredCount} of ${totalQuestions} questions. Unanswered questions score 0. Submit anyway?`
      );
      if (!proceed) return;
    }

    const payload = {
      enrollmentId: Number(enrollmentId),
      answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId: Number(questionId),
        selectedOptionId: Number(selectedOptionId),
      })),
    };

    try {
      submittedRef.current = true;
      setSubmitting(true);
      const response = await submitAssessment(id, payload);
      toast.success("Assessment submitted", { theme: "dark" });
      navigate(`/learner/assessments/${id}/result`, {
        state: { submission: response.data.data, title: assessment.title },
      });
    } catch (error) {
      console.error(error);
      submittedRef.current = false;
      toast.error(
        error.response?.data?.message || "Failed to submit assessment",
        { theme: "dark" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Loading assessment…
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="relative flex flex-col h-full space-y-4 sm:space-y-6 overflow-hidden pb-2 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0 max-w-3xl mx-auto w-full gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{assessment.description}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {answeredCount} of {totalQuestions} answered · {assessment.totalMarks} marks total
          </p>
        </div>
        {formattedTime && (
          <div
            className={`shrink-0 px-4 py-2 rounded-xl font-mono text-sm font-bold ${secondsLeft < 60
                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300"
              }`}
          >
            {formattedTime}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto max-w-3xl mx-auto w-full space-y-4 custom-scrollbar">
        {assessment.questions.map((question, qIndex) => (
          <div
            key={question.id}
            className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-[#3f3f3f] shadow-lg space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {qIndex + 1}. {question.questionText}
              </p>
              <span className="shrink-0 text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-semibold">
                {question.marks} {question.marks === 1 ? "mark" : "marks"}
              </span>
            </div>

            {question.questionType === "MCQ" ? (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${answers[question.id] === option.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                        : "border-gray-200 dark:border-[#3f3f3f] hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === option.id}
                      onChange={() => selectOption(question.id, option.id)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{option.optionText}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Coding questions are answered and graded in the code runner (not shown here).
              </p>
            )}
          </div>
        ))}

        <div className="pt-2 pb-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TakeAssessment;