import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Award, CheckCircle, Clock } from 'lucide-react';

import { selectUser } from '../../features/auth/authSlice';
import { fetchMyEnrollments, selectMyEnrollments } from '../../features/enrollments/enrollmentSlice';
import { fetchModulesByCourseId, selectModules, selectModulesLoading } from '../../features/modules/moduleSlice';
import { fetchLessonsByModuleId, selectLessonsByModuleId } from '../../features/lessons/lessonSlice';
import { fetchAssessmentsByModuleId, selectAssessmentsByModuleId } from '../../features/assessments/assessmentSlice';
import {
  fetchProgressByEnrollment,
  fetchProgressSummary,
  markLessonComplete,
  selectIsLessonComplete,
  selectProgressSummaryFor,
} from '../../features/lessonProgress/lessonProgressSlice';

function ModuleLessons({ moduleId, currentLessonId, onSelectLesson }) {
  const dispatch = useDispatch();
  const lessons = useSelector(selectLessonsByModuleId(moduleId));

  useEffect(() => {
    dispatch(fetchLessonsByModuleId(moduleId));
  }, [dispatch, moduleId]);

  if (lessons.length === 0) {
    return <p className="p-3 pl-8 text-xs text-slate-400">No lessons yet.</p>;
  }

  return (
    <div className="bg-transparent space-y-1 py-1">
      {lessons.map((lesson) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          isActive={currentLessonId === lesson.id}
          onSelect={() => onSelectLesson(lesson)}
        />
      ))}
    </div>
  );
}

function LessonRow({ lesson, isActive, onSelect }) {
  const isComplete = useSelector(selectIsLessonComplete(lesson.id));

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer ${isActive
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md shadow-purple-500/25'
        : 'hover:bg-slate-100 dark:hover:bg-[#222736] text-slate-600 dark:text-slate-400'
        }`}
    >
      <span className="flex items-center space-x-2 truncate pr-2">
        {isComplete ? (
          <i className="fa-solid fa-circle-check text-emerald-500"></i>
        ) : (
          <i className="fa-regular fa-circle text-slate-400 text-[10px]"></i>
        )}
        <span className="truncate">{lesson.title}</span>
      </span>
      <span className="shrink-0 opacity-70 text-[10px]">{lesson.duration || ''}</span>
    </button>
  );
}

export default function CoursePlayer() {
  const { id: courseId } = useParams();
  const [searchParams] = useSearchParams();
  const targetLessonId = searchParams.get('lessonId');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const user = useSelector(selectUser);
  const enrollments = useSelector(selectMyEnrollments);
  const modules = useSelector(selectModules);
  const modulesLoading = useSelector(selectModulesLoading);

  const [activeModule, setActiveModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [noteText, setNoteText] = useState('');

  // Fetch assessments for the currently expanded module
  const assessments = useSelector(selectAssessmentsByModuleId(activeModule));

  useEffect(() => {
    if (enrollments.length === 0 && user?.email) {
      dispatch(fetchMyEnrollments(user.email));
    }
  }, [dispatch, enrollments.length, user?.email]);

  const enrollment = useMemo(() => {
    return enrollments.find((e) => {
      const c = e.batch?.course;
      const cId = c?.id || c?._id;
      return String(cId) === String(courseId);
    }) || null;
  }, [enrollments, courseId]);

  const enrollmentId = enrollment?.id ?? null;
  const course = enrollment?.batch?.course;
  const summary = useSelector(selectProgressSummaryFor(enrollmentId));

  useEffect(() => {
    if (courseId) dispatch(fetchModulesByCourseId(courseId));
  }, [dispatch, courseId]);

  useEffect(() => {
    if (enrollmentId) {
      dispatch(fetchProgressByEnrollment(enrollmentId));
      dispatch(fetchProgressSummary(enrollmentId));
    }
  }, [dispatch, enrollmentId]);

  useEffect(() => {
    if (activeModule) {
      dispatch(fetchAssessmentsByModuleId(activeModule));
    }
  }, [dispatch, activeModule]);

  useEffect(() => {
    if (modules.length > 0 && !activeModule) {
      setActiveModule(modules[0].id);
    }
  }, [modules, activeModule]);

  const showFeedback = (text) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 800);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const video = videoRef.current;
      if (!video) return;

      if (e.code === 'Space') {
        e.preventDefault();
        video.paused ? video.play() : video.pause();
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        showFeedback('+5s ⏩');
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        showFeedback('⏪ -5s');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoEnded = () => {
    if (currentLesson && enrollmentId) {
      dispatch(markLessonComplete({ lessonId: currentLesson.id, enrollmentId }));
    }
  };

  const handleMarkComplete = () => {
    if (currentLesson && enrollmentId) {
      dispatch(markLessonComplete({ lessonId: currentLesson.id, enrollmentId }));
      showFeedback('Marked Complete ✓');
    }
  };

  if (!user?.email) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#151821] text-slate-400">Loading your account…</div>;
  }
  if (enrollments.length > 0 && !enrollment) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#151821] text-rose-500">You're not enrolled in this course.</div>;
  }
  if (!enrollment || modulesLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#151821] text-slate-400">Loading course…</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#151821] text-slate-900 dark:text-[#f1f3f9] font-sans transition-colors duration-300 py-8">
      <main className="max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Sidebar (3 spans): Course Curriculum & Module Assessments */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#262b38] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Course Curriculum</h3>
              <button
                onClick={() => navigate(`/learner/courses/${courseId}/grades`)}
                className="text-[11px] font-mono text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Award size={13} /> Grades
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {modules.length === 0 && (
                <p className="text-xs text-slate-400 p-2">No modules yet for this course.</p>
              )}

              {modules.map((module) => {
                const isExpanded = activeModule === module.id;
                return (
                  <div key={module.id} className="border border-slate-200 dark:border-[#3e4658] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#222736]/40">
                    <button
                      onClick={() => setActiveModule(isExpanded ? null : module.id)}
                      className="w-full p-3.5 flex items-center justify-between cursor-pointer font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222736] transition"
                    >
                      <span className="text-xs font-semibold truncate pr-2">{module.title}</span>
                      <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-xs text-slate-400`}></i>
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-3">
                        <ModuleLessons
                          moduleId={module.id}
                          currentLessonId={currentLesson?.id}
                          onSelectLesson={setCurrentLesson}
                        />

                        {/* Module Assessments Button inside Sidebar */}
                        {assessments?.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 px-2 space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">Module Quizzes</span>
                            {assessments.map((asm) => (
                              <button
                                key={asm.id}
                                onClick={() => navigate(`/learner/assessments/${asm.id}/take`)}
                                className="w-full text-left p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition text-xs font-semibold flex items-center justify-between cursor-pointer border border-emerald-500/20"
                              >
                                <span className="truncate pr-1">{asm.title}</span>
                                <CheckCircle size={13} className="shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Main Area (6 spans): Video Player, Metadata & Interactive Tabs */}
        <div className="lg:col-span-6 flex flex-col space-y-6">

          {/* Course Player Box */}
          <div className="bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#262b38] rounded-3xl overflow-hidden shadow-2xl">
            <div
              ref={videoContainerRef}
              className="relative bg-black aspect-video flex items-center justify-center group"
            >
              {currentLesson ? (
                <video
                  ref={videoRef}
                  src={currentLesson.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  autoPlay
                  onEnded={handleVideoEnded}
                />
              ) : (
                <div className="text-center p-6">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200"
                    alt="Lesson Thumbnail"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-slate-950/60"></div>
                  <p className="relative z-10 text-slate-200 text-sm font-medium">Select a lesson from the curriculum to begin</p>
                </div>
              )}

              {feedback && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-lg font-semibold shadow-2xl border border-white/10">
                    {feedback}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Metadata */}
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-slate-200 dark:border-[#262b38]">
              <div>
                <span className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 font-semibold bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                  {course?.title || 'Course Details'}
                </span>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                  {currentLesson?.title || 'No lesson selected'}
                </h1>
              </div>
              <button
                onClick={handleMarkComplete}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-purple-500/25 flex items-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-check"></i>
                <span>Mark as Complete</span>
              </button>
            </div>
          </div>

          {/* Interactive Tabs */}
          <div className="bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#262b38] rounded-3xl p-6 shadow-xl">
            <div className="flex space-x-6 border-b border-slate-200 dark:border-[#262b38] pb-3 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('notes')}
                className={`${activeTab === 'notes' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 pb-3 -mb-3' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'} transition cursor-pointer`}
              >
                Lesson Notes
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`${activeTab === 'resources' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 pb-3 -mb-3' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'} transition cursor-pointer`}
              >
                Resources (3)
              </button>
            </div>

            {activeTab === 'notes' && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Take private notes for this lesson..."
                  className="w-full bg-slate-50 dark:bg-[#222736] border border-slate-200 dark:border-[#3e4658] rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 resize-none h-24 shadow-inner"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => alert('Note saved successfully!')}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <div className="p-3 bg-slate-50 dark:bg-[#222736] rounded-xl border border-slate-200 dark:border-[#3e4658] flex justify-between items-center">
                  <span>Lecture Slides.pdf</span>
                  <button className="text-purple-400 font-medium hover:underline text-xs cursor-pointer">Download</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar (3 spans): Overall Progress Tracker */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#262b38] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Overall Progress</h3>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                {summary ? `${summary.completionPercentage}% Completed` : '0% Completed'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#222736] h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                style={{ width: `${summary?.completionPercentage || 0}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-[#222736] p-3 rounded-2xl border border-slate-200 dark:border-[#3e4658]">
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {summary ? `${summary.completedLessons}/${summary.totalLessons}` : '0/0'}
                </span>
                <p className="text-[10px] uppercase font-mono text-slate-400 mt-0.5">Lessons Done</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#222736] p-3 rounded-2xl border border-slate-200 dark:border-[#3e4658]">
                <span className="text-xl font-black text-emerald-400 font-mono">Active</span>
                <p className="text-[10px] uppercase font-mono text-slate-400 mt-0.5">Status</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}