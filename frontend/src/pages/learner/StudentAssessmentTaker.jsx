import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award, CheckCircle, Loader2, RotateCcw, Code } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');`;

export default function StudentAssessmentTaker() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessments/${assessmentId}`);
        const asm = res.data?.data || res.data;
        if (isMounted) setAssessment(asm);
      } catch (err) {
        console.error("Failed to load assessment", err);
        toast.error("Failed to load assessment questions", { theme: "dark" });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [assessmentId]);

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionId });
  };

  const handleCodingChange = (questionId, codeText) => {
    setCodingAnswers({ ...codingAnswers, [questionId]: codeText });
  };

  const handleSubmitQuiz = async () => {
    if (!assessment || !assessment.questions) return;

    const enrollmentId = localStorage.getItem("activeEnrollmentId") || 1;

    const answersPayload = assessment.questions.map((q) => {
      if (q.questionType === "CODING") {
        return {
          questionId: Number(q.id),
          code: codingAnswers[q.id] || ""
        };
      }
      return {
        questionId: Number(q.id),
        selectedOptionId: selectedAnswers[q.id] ? Number(selectedAnswers[q.id]) : null
      };
    });

    try {
      setSubmitting(true);
      const payload = {
        enrollmentId: Number(enrollmentId),
        answers: answersPayload
      };

      const response = await api.post(`/assessments/${assessmentId}/submit`, payload);
      const submissionData = response.data?.data || response.data;

      setResult({
        score: submissionData.score ?? 0,
        totalMarks: submissionData.totalMarks ?? assessment.totalMarks,
        percentage: submissionData.percentage ?? 0,
        status: submissionData.status || "SUBMITTED"
      });

      toast.success("Assessment submitted successfully!", { theme: "dark" });
    } catch (err) {
      console.error("Failed to submit assessment", err);
      toast.error(err.response?.data?.message || "Failed to submit assessment", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-xs bg-slate-950">
        <Loader2 className="animate-spin mr-2 text-emerald-500" size={16} /> Loading assessment questions...
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-[#F6F5F1] via-[#EFECE6] to-[#E5E2D9] dark:from-[#0b0f17] dark:via-[#111827] dark:to-[#0f172a] text-slate-900 dark:text-[#f1f3f9] p-6 sm:p-8 font-sans transition-colors duration-500"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      <div className="max-w-4xl mx-auto space-y-6">

        {result ? (
          <div className="p-8 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800 text-center space-y-6 shadow-2xl animate-fade-in relative">
            <div className="absolute top-6 left-6">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Attempt #{attemptNumber}
              </span>
            </div>

            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-2xl font-bold mt-4">
              <Award size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-fraunces">Assessment Graded Result</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{assessment?.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto py-2">
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Marks Obtained</span>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{result.score} / {result.totalMarks}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Percentage</span>
                <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{Number(result.percentage).toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Result Status</span>
                <p className={`text-xs font-bold font-mono mt-2 uppercase ${Number(result.percentage) >= 40 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {Number(result.percentage) >= 40 ? 'Passed' : 'Needs Improvement'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate("/learner/assessments")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer shadow-lg"
              >
                Back to Assignments
              </button>
              <button
                onClick={() => { setResult(null); setSelectedAnswers({}); setCodingAnswers({}); setAttemptNumber(c => c + 1); }}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Retake Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800 space-y-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active Assessment Quiz
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Attempt #{attemptNumber}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-fraunces mt-2 text-slate-900 dark:text-white">{assessment?.title}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{assessment?.description}</p>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-3">
                <span>Total Marks: {assessment?.totalMarks}</span>
                {assessment?.duration && <span>• Duration: {assessment.duration} mins</span>}
              </div>
            </div>

            <div className="space-y-6 pt-4">
              {assessment?.questions?.map((q, qIdx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Q{qIdx + 1}. {q.questionText}
                    </span>
                    <span className="text-xs font-mono text-slate-400 shrink-0">{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                  </div>

                  {q.questionType === "CODING" ? (
                    <div className="space-y-3 pt-2">
                      {q.problemStatement && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{q.problemStatement}</p>
                      )}
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1 pb-1">
                          <Code size={13} /> Solution Code (Python / Java / JavaScript / C++)
                        </label>
                        <textarea
                          value={codingAnswers[q.id] || ""}
                          onChange={(e) => handleCodingChange(q.id, e.target.value)}
                          placeholder="// Write your solution here..."
                          rows={6}
                          className="w-full p-4 rounded-xl font-mono text-xs bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {q.options?.map((opt) => {
                        const isSelected = selectedAnswers[q.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt.id)}
                            className={`text-left px-4 py-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3 shadow-sm ${
                              isSelected 
                                ? "bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-2 ring-emerald-500/20" 
                                : "bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 transition-colors ${
                              isSelected 
                                ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/30' 
                                : 'border-slate-300 dark:border-slate-600 bg-transparent'
                            }`}>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white animate-scaleIn" />}
                            </span>
                            <span className="truncate text-xs sm:text-sm">{opt.optionText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                disabled={submitting}
                onClick={handleSubmitQuiz}
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />} Submit Assessment
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}