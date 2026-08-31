import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ChevronRight, ChevronDown, Loader2, FileText, Inbox } from "lucide-react";

import { getCourses } from "../../api/courseApi";
import { getModulesByCourseId } from "../../api/moduleApi";
import { getAllAssessments, getAssessmentSubmissions } from "../../api/assessmentApi";

/*
  Drill-down: Course -> Module -> Assessment -> Submissions

  Wiring:
    Courses      -> GET /api/courses                          (getCourses)
    Modules      -> GET /api/modules/course/:courseId          (getModulesByCourseId)
    Assessments  -> GET /api/assessments?moduleId=X            (getAllAssessments)
    Submissions  -> GET /api/assessments/:id/submissions       (getAssessmentSubmissions)

  Adjust the three import paths above ("../../api/...") to match where
  your api client files actually live.

  NOTE: same pagination caveat as the module page — getCourses() is
  called with no args, so if getCourses defaults to page=1/limit=10 on
  the backend, an instructor with many courses will only see the first
  page here.
*/

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');`;

const ink = "#20241F";
const paper = "#F6F5F1";
const line = "#E1DFD5";
const forest = "#2F4B33";
const gold = "#B8842E";
const muted = "#6E7268";
const danger = "#A6432F";
const success = "#2F6B4F";

function StatusPill({ percentage, status }) {
  const passed = Number(percentage) >= 40;
  const label = status === "SUBMITTED" ? (passed ? "Passed" : "Failed") : status;
  const color = status !== "SUBMITTED" ? muted : passed ? success : danger;
  const bg = status !== "SUBMITTED" ? "#EDEBE1" : passed ? "#E7F1EB" : "#FBEAE5";
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color, background: bg, fontFamily: "IBM Plex Mono, monospace" }}
    >
      {label}
    </span>
  );
}

function Breadcrumb({ course, mod, assessment, onGoCourse, onGoModule }) {
  return (
    <div className="flex items-center flex-wrap gap-1 text-sm" style={{ color: muted, fontFamily: "Inter, sans-serif" }}>
      <button onClick={onGoCourse} className="hover:underline" style={{ color: course ? ink : muted }}>
        {course ? course.title : "Select a course"}
      </button>
      {mod && (
        <>
          <ChevronRight size={14} />
          <button onClick={onGoModule} className="hover:underline" style={{ color: assessment ? ink : forest }}>
            {mod.title}
          </button>
        </>
      )}
      {assessment && (
        <>
          <ChevronRight size={14} />
          <span style={{ color: forest, fontWeight: 500 }}>{assessment.title}</span>
        </>
      )}
    </div>
  );
}

export default function InstructorSubmissions() {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Load courses on mount
  useEffect(() => {
    (async () => {
      try {
        setCoursesLoading(true);
        const response = await getCourses();
        setCourses(response.data.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load courses", { theme: "dark" });
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, []);

  // Load modules when course changes
  useEffect(() => {
    setSelectedModuleId(null);
    setSelectedAssessmentId(null);
    setModules([]);
    setAssessments([]);
    setSubmissions([]);
    if (!selectedCourseId) return;

    (async () => {
      try {
        setModulesLoading(true);
        const response = await getModulesByCourseId(selectedCourseId);
        setModules(response.data.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load modules", { theme: "dark" });
      } finally {
        setModulesLoading(false);
      }
    })();
  }, [selectedCourseId]);

  // Load assessments when module changes
  useEffect(() => {
    setSelectedAssessmentId(null);
    setAssessments([]);
    setSubmissions([]);
    if (!selectedModuleId) return;

    (async () => {
      try {
        setAssessmentsLoading(true);
        const response = await getAllAssessments(selectedModuleId);
        setAssessments(response.data.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load assessments", { theme: "dark" });
      } finally {
        setAssessmentsLoading(false);
      }
    })();
  }, [selectedModuleId]);

  // Load submissions when assessment changes
  useEffect(() => {
    setSubmissions([]);
    if (!selectedAssessmentId) return;

    (async () => {
      try {
        setSubmissionsLoading(true);
        const response = await getAssessmentSubmissions(selectedAssessmentId);
        setSubmissions(response.data.data || []);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to load submissions", { theme: "dark" });
      } finally {
        setSubmissionsLoading(false);
      }
    })();
  }, [selectedAssessmentId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;
  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;
  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId) || null;

  return (
    <div style={{ background: paper, minHeight: "100%", fontFamily: "Inter, sans-serif" }} className="w-full">
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <div className="px-8 pt-8 pb-5" style={{ borderBottom: `1px solid ${line}` }}>
        <div className="text-xs font-medium uppercase tracking-widest" style={{ color: gold, fontFamily: "IBM Plex Mono, monospace" }}>
          Student Submissions
        </div>
        <h1 className="text-3xl mt-1 mb-3" style={{ fontFamily: "Fraunces, serif", color: ink, fontWeight: 600 }}>
          Review Assessment Results
        </h1>

        <Breadcrumb
          course={selectedCourse}
          mod={selectedModule}
          assessment={selectedAssessment}
          onGoCourse={() => {
            setSelectedModuleId(null);
            setSelectedAssessmentId(null);
          }}
          onGoModule={() => setSelectedAssessmentId(null)}
        />
      </div>

      <div className="p-8 space-y-6">
        {/* Step 1: course selector */}
        <div className="relative max-w-md">
          <select
            value={selectedCourseId ?? ""}
            onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
            disabled={coursesLoading}
            className="w-full appearance-none px-3 py-2.5 pr-9 rounded-md border text-sm outline-none cursor-pointer disabled:cursor-wait"
            style={{ borderColor: line, background: "#FFFFFF", color: ink, fontFamily: "Inter, sans-serif" }}
          >
            <option value="" disabled>
              {coursesLoading ? "Loading courses…" : "Select a course"}
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-3" style={{ color: muted, pointerEvents: "none" }} />
        </div>

        {!selectedCourseId && !coursesLoading && (
          <div
            className="h-48 flex flex-col items-center justify-center rounded-md text-center gap-2"
            style={{ border: `1px dashed ${line}`, color: muted }}
          >
            <FileText size={20} />
            <span className="text-sm">Select a course to see its modules</span>
          </div>
        )}

        {/* Step 2: module chips */}
        {selectedCourseId && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: ink, fontFamily: "IBM Plex Mono, monospace" }}>
              Modules
            </h2>
            {modulesLoading ? (
              <div className="flex items-center gap-2 text-sm py-2" style={{ color: muted }}>
                <Loader2 size={14} className="animate-spin" /> Loading modules…
              </div>
            ) : modules.length === 0 ? (
              <div className="text-sm py-2" style={{ color: muted }}>
                This course has no modules yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModuleId(m.id)}
                    className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                    style={{
                      background: selectedModuleId === m.id ? forest : "#FFFFFF",
                      color: selectedModuleId === m.id ? paper : ink,
                      borderColor: selectedModuleId === m.id ? forest : line,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: assessment list */}
        {selectedModuleId && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: ink, fontFamily: "IBM Plex Mono, monospace" }}>
              Assessments
            </h2>
            {assessmentsLoading ? (
              <div className="flex items-center gap-2 text-sm py-2" style={{ color: muted }}>
                <Loader2 size={14} className="animate-spin" /> Loading assessments…
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-sm py-2" style={{ color: muted }}>
                This module has no assessments yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assessments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAssessmentId(a.id)}
                    className="text-left p-4 rounded-md border transition-colors"
                    style={{
                      background: "#FFFFFF",
                      borderColor: selectedAssessmentId === a.id ? forest : line,
                      borderWidth: selectedAssessmentId === a.id ? 2 : 1,
                    }}
                  >
                    <div className="text-sm font-medium" style={{ color: ink }}>
                      {a.title}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace" }}>
                      <span>{a.totalMarks} marks</span>
                      {a.duration && <span>{a.duration} min</span>}
                      <span>{a.questions?.length ?? 0} questions</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: submissions table */}
        {selectedAssessmentId && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: ink, fontFamily: "IBM Plex Mono, monospace" }}>
              Submissions
            </h2>

            {submissionsLoading ? (
              <div className="flex items-center gap-2 text-sm py-6" style={{ color: muted }}>
                <Loader2 size={14} className="animate-spin" /> Loading submissions…
              </div>
            ) : submissions.length === 0 ? (
              <div
                className="p-8 flex flex-col items-center justify-center rounded-md text-center gap-2"
                style={{ border: `1px dashed ${line}`, color: muted }}
              >
                <Inbox size={20} />
                <span className="text-sm">No students have submitted this assessment yet</span>
              </div>
            ) : (
              <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${line}` }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#EDEBE1" }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase" }}>
                        Student
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase" }}>
                        Email
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase" }}>
                        Score
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase" }}>
                        Status
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase" }}>
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s, i) => (
                      <tr key={s.id} style={{ background: "#FFFFFF", borderTop: i > 0 ? `1px solid ${line}` : "none" }}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: ink }}>
                          {s.enrollment?.studentName || "—"}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: muted }}>
                          {s.enrollment?.studentEmail || "—"}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: ink, fontFamily: "IBM Plex Mono, monospace" }}>
                          {s.score} / {s.totalMarks}{" "}
                          <span style={{ color: muted }}>({Number(s.percentage ?? 0).toFixed(1)}%)</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusPill percentage={s.percentage} status={s.status} />
                        </td>
                        <td className="px-4 py-2.5" style={{ color: muted, fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}