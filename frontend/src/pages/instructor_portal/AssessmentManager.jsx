import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  Search,
  BarChart2,
  Award,
} from "lucide-react";

import { getCourses } from "../../api/courseApi";

import {
  fetchModulesByCourseId,
  selectModules,
  selectModulesLoading,
  selectModulesError,
  clearModuleError,
} from "../../features/modules/moduleSlice";

import {
  fetchAssessmentsByModuleId,
  createAssessmentThunk,
  updateAssessmentThunk,
  deleteAssessmentThunk,
  fetchAssessmentAnalytics,
  selectAssessmentsByModuleId,
  selectAssessmentsLoading,
  selectAssessmentError, 
  selectAssessmentAnalytics,
  clearAssessmentError,
} from "../../features/assessments/assessmentSlice";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');`;

function IconBtn({ onClick, title, tone = "default", disabled, children }) {
  const toneClasses =
    tone === "danger"
      ? "text-red-500 hover:bg-red-500/10"
      : tone === "accent"
      ? "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
      : "text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5";
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer ${toneClasses}`}
    >
      {children}
    </button>
  );
}

function ConfirmDelete({ label, busy, onCancel, onConfirm }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm backdrop-blur-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 shadow-lg"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <AlertCircle size={16} className="text-red-500 shrink-0" />
      <span className="text-slate-900 dark:text-slate-100 font-medium truncate">Delete "{label}"?</span>
      <button
        onClick={onConfirm}
        disabled={busy}
        className="ml-auto px-3 py-1 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition shadow-md shadow-red-500/20 cursor-pointer"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      <button
        onClick={onCancel}
        disabled={busy}
        className="px-3 py-1 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
      >
        Cancel
      </button>
    </div>
  );
}

function AssessmentForm({ initial, saving, onCancel, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [duration, setDuration] = useState(initial?.duration || "");
  const [totalMarks, setTotalMarks] = useState(initial?.totalMarks || 10);

  // Each assessment has multiple questions, each with 4 options and instructor-entered correct answer
  const [questions, setQuestions] = useState(
  initial?.questions
    ? JSON.parse(JSON.stringify(initial.questions))
    : [
        {
          questionText: "",
          marks: 1,
          questionType: "MCQ",
          options: [
            { optionText: "", isCorrect: true },
            { optionText: "", isCorrect: false },
            { optionText: "", isCorrect: false },
            { optionText: "", isCorrect: false },
          ],
        },
      ]
);

const handleQuestionChange = (qIndex, field, value) => {
  const updated = [...questions];       // new array, but same object refs inside
  updated[qIndex][field] = value;       // <- mutates the object that's still in Redux state!
  setQuestions(updated);
};

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const updated = [...questions];
    if (field === "isCorrect") {
      // Ensure only one option is marked correct among the 4 options
      updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === oIndex,
      }));
    } else {
      updated[qIndex].options[oIndex][field] = value;
    }
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        marks: 1,
        questionType: "MCQ",
        options: [
          { optionText: "", isCorrect: true },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  return (
    <div
      className="p-6 rounded-3xl space-y-6 backdrop-blur-2xl bg-white/80 dark:bg-[#1a1e2b]/90 border border-white/40 dark:border-slate-700/60 shadow-2xl transition-all max-h-[80vh] overflow-y-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {initial ? "Edit Assessment" : "Create New Assessment"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Assessment Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Java Fundamentals Quiz"
            className="mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Total Marks
          </label>
          <input
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(Number(e.target.value))}
            className="mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief details regarding this assessment..."
          rows={2}
          className="mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Duration (Minutes)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 30"
          className="mt-1.5 w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      {/* Questions Builder */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300">
            Questions (4 Options per Question)
          </h4>
          <button
            type="button"
            onClick={addQuestion}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Question
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">Q{qIndex + 1}</span>
              <input
                value={q.questionText}
                onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                placeholder="Enter question statement..."
                className="flex-1 px-3 py-2 rounded-xl border text-xs outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={q.marks}
                onChange={(e) => handleQuestionChange(qIndex, "marks", Number(e.target.value))}
                placeholder="Marks"
                className="w-20 px-3 py-2 rounded-xl border text-xs outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* 4 Options & Instructor Correct Answer Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-option-${qIndex}`}
                    checked={opt.isCorrect}
                    onChange={() => handleOptionChange(qIndex, oIndex, "isCorrect", true)}
                    title="Mark as correct answer"
                    className="cursor-pointer accent-emerald-600"
                  />
                  <input
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, "optionText", e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-xl border text-xs outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          disabled={!title.trim() || saving}
          onClick={() =>
            onSave({
              title: title.trim(),
              description: description.trim(),
              totalMarks: Number(totalMarks),
              duration: duration ? Number(duration) : null,
              questions,
            })
          }
          className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-green-500 transition cursor-pointer"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Save Assessment
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Instructor view to see submissions performance (Marks, Attended Questions, Percentage)
function AssessmentAnalyticsView({ assessmentId, onBack }) {
  const dispatch = useDispatch();
  const analytics = useSelector(selectAssessmentAnalytics(assessmentId));

  useEffect(() => {
    if (assessmentId) {
      dispatch(fetchAssessmentAnalytics(assessmentId));
    }
  }, [dispatch, assessmentId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-fraunces">Assessment Performance & Submissions</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
        >
          ← Back to Assessments
        </button>
      </div>

      <div className="backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Marks Obtained</th>
              <th className="py-3 px-4">Total Attended / Questions</th>
              <th className="py-3 px-4">Percentage</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {analytics?.submissions?.length > 0 ? (
              analytics.submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {sub.enrollment?.studentName || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{sub.enrollment?.studentEmail || "N/A"}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {sub.score ?? 0} / {sub.totalMarks}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {sub.answers?.length || 0} answered
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {sub.percentage != null ? `${sub.percentage.toFixed(1)}%` : "0%"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  No student submissions recorded for this assessment yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AssessmentManager({ initialCourseId = null }) {
  const dispatch = useDispatch();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [searchQuery, setSearchQuery] = useState("");

  const modules = useSelector(selectModules);
  const modulesLoading = useSelector(selectModulesLoading);
  const modulesError = useSelector(selectModulesError);

  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedAssessmentIdForAnalytics, setSelectedAssessmentIdForAnalytics] = useState(null);

  const selectModuleAssessments = useMemo(
  () => selectAssessmentsByModuleId(selectedModuleId),
  [selectedModuleId]
);
const assessments = useSelector(selectModuleAssessments);

  const assessmentsLoading = useSelector(selectAssessmentsLoading);
  const assessmentsError = useSelector(selectAssessmentError);

  const [assessmentFormMode, setAssessmentFormMode] = useState(null); // null | 'new' | assessmentId
  const [confirmDeleteAssessment, setConfirmDeleteAssessment] = useState(null);
  const [savingAssessmentId, setSavingAssessmentId] = useState(null);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState(null);

  // Load courses catalog using proper courseApi
  useEffect(() => {
    (async () => {
      try {
        setCoursesLoading(true);
        const response = await getCourses();

        // Handle both direct array or paginated/wrapped responses safely:
        const list = response.data.data || response.data || [];

        setCourses(list);
        if (!selectedCourseId && list.length === 1) {
          setSelectedCourseId(list[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load courses", { theme: "dark" });
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, [selectedCourseId]);

  useEffect(() => {
    if (modulesError) {
      toast.error(modulesError, { theme: "dark" });
      dispatch(clearModuleError());
    }
  }, [modulesError, dispatch]);

  useEffect(() => {
    if (assessmentsError) {
      toast.error(assessmentsError, { theme: "dark" });
      dispatch(clearAssessmentError());
    }
  }, [assessmentsError, dispatch]);

  useEffect(() => {
    if (selectedCourseId) dispatch(fetchModulesByCourseId(selectedCourseId));
    setSelectedModuleId(null);
    setSelectedAssessmentIdForAnalytics(null);
  }, [selectedCourseId, dispatch]);

  useEffect(() => {
    if (modules.length && selectedModuleId == null) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  useEffect(() => {
    if (selectedModuleId != null) {
      dispatch(fetchAssessmentsByModuleId(selectedModuleId));
    }
  }, [selectedModuleId, dispatch]);

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => c.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [courses, searchQuery]);

  // Assessment CRUD operations
  const handleCreateAssessment = async (data) => {
    setSavingAssessmentId("new");
    try {
      await dispatch(createAssessmentThunk({ ...data, moduleId: selectedModuleId })).unwrap();
      setAssessmentFormMode(null);
      toast.success("Assessment created successfully", { theme: "dark" });
    } catch (err) {
      toast.error(err?.message || "Failed to create assessment", { theme: "dark" });
    } finally {
      setSavingAssessmentId(null);
    }
  };

  const handleSaveAssessment = async (id, data) => {
    setSavingAssessmentId(id);
    try {
      await dispatch(updateAssessmentThunk({ id, data })).unwrap();
      setAssessmentFormMode(null);
      toast.success("Assessment updated successfully", { theme: "dark" });
    } catch (err) {
      toast.error(err?.message || "Failed to update assessment", { theme: "dark" });
    } finally {
      setSavingAssessmentId(null);
    }
  };

  const handleDeleteAssessment = async (id) => {
    setDeletingAssessmentId(id);
    try {
      await dispatch(deleteAssessmentThunk(id)).unwrap();
      setConfirmDeleteAssessment(null);
      toast.success("Assessment deleted successfully", { theme: "dark" });
    } catch (err) {
      toast.error(err?.message || "Failed to delete assessment", { theme: "dark" });
    } finally {
      setDeletingAssessmentId(null);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-[#F6F5F1] via-[#EFECE6] to-[#E5E2D9] dark:from-[#0b0f17] dark:via-[#111827] dark:to-[#0f172a] text-slate-900 dark:text-[#f1f3f9] transition-colors duration-500 font-sans"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Header & Course Selection/Search Hub */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
              Assessment Management Hub
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1" style={{ fontFamily: "Fraunces, serif" }}>
              {selectedCourse ? selectedCourse.title : "Select a Course"}
            </h1>
            {selectedCourse && (
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>{modules.length} modules available</span>
                {modulesLoading && (
                  <span className="flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> syncing
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl text-xs bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md text-slate-900 dark:text-white transition-all shadow-sm"
              />
            </div>
            <select
              value={selectedCourseId ?? ""}
              onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
              disabled={coursesLoading}
              className="w-full sm:w-56 px-4 py-2 rounded-2xl text-xs font-semibold bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer backdrop-blur-md text-slate-900 dark:text-white shadow-sm transition-all"
            >
              <option value="" disabled className="bg-white dark:bg-slate-900">
                {coursesLoading ? "Loading courses…" : "Choose a course…"}
              </option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedCourseId ? (
        <div className="max-w-4xl mx-auto my-16 p-12 rounded-3xl backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800 shadow-2xl text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
            <Award size={28} />
          </div>
          <h3 className="text-xl font-bold">No Course Selected</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Choose a course from the selector above to manage module assessments, questions, options, and student analytics.
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Module Left Panel (4 Spans) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-700 dark:text-slate-300 mb-4">
                  Modules (Select to view Assessments)
                </h2>

                <div className="space-y-2.5">
                  {modules.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModuleId(m.id);
                        setSelectedAssessmentIdForAnalytics(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 backdrop-blur-md cursor-pointer ${
                        selectedModuleId === m.id
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/25 border border-white/20 font-medium"
                          : "bg-white/40 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 shadow-sm"
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center shrink-0 font-mono ${
                          selectedModuleId === m.id
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 text-xs font-semibold truncate">{m.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Assessment Right Main Panel (8 Spans) */}
            <div className="lg:col-span-8">
              <div className="backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl min-h-[500px]">
                {!selectedModuleId ? (
                  <div className="h-64 flex flex-col items-center justify-center rounded-2xl text-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                    <FileText size={24} />
                    <span className="text-xs">Select a module from the left panel to manage assessments</span>
                  </div>
                ) : selectedAssessmentIdForAnalytics ? (
                  <AssessmentAnalyticsView
                    assessmentId={selectedAssessmentIdForAnalytics}
                    onBack={() => setSelectedAssessmentIdForAnalytics(null)}
                  />
                ) : (
                  <>
                    <div className="mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-800/60 flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: "Fraunces, serif" }}>
                          {selectedModule?.title} — Assessments
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Manage multiple assessments, questions, 4 options, and review student performance marks.
                        </p>
                      </div>
                      <button
                        onClick={() => setAssessmentFormMode("new")}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-green-500 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add Assessment
                      </button>
                    </div>

                    {assessmentFormMode === "new" && (
                      <div className="mb-6">
                        <AssessmentForm
                          saving={savingAssessmentId === "new"}
                          onCancel={() => setAssessmentFormMode(null)}
                          onSave={handleCreateAssessment}
                        />
                      </div>
                    )}

                    {assessmentsLoading && assessments.length === 0 && (
                      <div className="text-xs py-8 text-center text-slate-400">Loading module assessments…</div>
                    )}

                    <div className="space-y-4">
                      {assessments?.length === 0 && assessmentFormMode !== "new" && (
                        <div className="p-8 flex flex-col items-center justify-center rounded-2xl text-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                          <span className="text-xs">No assessments created for this module yet</span>
                        </div>
                      )}

                      {assessments?.map((asm) => (
                        <div key={asm.id}>
                          {assessmentFormMode === asm.id ? (
                            <AssessmentForm
                              initial={asm}
                              saving={savingAssessmentId === asm.id}
                              onCancel={() => setAssessmentFormMode(null)}
                              onSave={(data) => handleSaveAssessment(asm.id, data)}
                            />
                          ) : confirmDeleteAssessment === asm.id ? (
                            <ConfirmDelete
                              label={asm.title}
                              busy={deletingAssessmentId === asm.id}
                              onCancel={() => setConfirmDeleteAssessment(null)}
                              onConfirm={() => handleDeleteAssessment(asm.id)}
                            />
                          ) : (
                            <div className="p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-slate-800/70">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{asm.title}</h4>
                                {asm.description && <p className="text-xs text-slate-500">{asm.description}</p>}
                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                                  <span>Total Marks: {asm.totalMarks}</span>
                                  <span>•</span>
                                  <span>{asm.questions?.length || 0} Questions</span>
                                  {asm.duration && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock size={11} /> {asm.duration} mins
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {/* Instructor Analytics Action: View Marks, Total Attended, and Percentage */}
                                <button
                                  onClick={() => setSelectedAssessmentIdForAnalytics(asm.id)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition flex items-center gap-1 cursor-pointer"
                                  title="View learner marks, attended questions, and percentage"
                                >
                                  <BarChart2 size={13} /> Submissions Analytics
                                </button>
                                <IconBtn title="Edit Assessment" onClick={() => setAssessmentFormMode(asm.id)}>
                                  <Pencil size={14} />
                                </IconBtn>
                                <IconBtn title="Delete Assessment" tone="danger" onClick={() => setConfirmDeleteAssessment(asm.id)}>
                                  <Trash2 size={14} />
                                </IconBtn>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}