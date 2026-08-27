import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import InstructorLayout from "../layouts/InstructorLayout";
import InstructorDashboard from "../pages/instructor_portal/InstructorDashboard";

import AssessmentManager from "../pages/instructor_portal/AssessmentManager";
import ModuleManager from '../pages/instructor_portal/ModuleManager';
import StudentAssessmentTaker from "../pages/instructor_portal/StudentAssessmentTaker";

function InstructorRoutes() {
  return (
    <Routes>
      <Route path="/" element={<InstructorLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* Instructor Dashboards & Courses */}
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="modules" element={<ModuleManager />} />
        <Route path="assignments" element={<AssessmentManager />} />
        <Route path="assessments/:assessmentId/submissions" element={<StudentAssessmentTaker />} />
        {/* <Route path="modules" element={<ModuleList />} />
        <Route path="modules/add" element={<AddModule />} />
        <Route path="modules/edit/:id" element={<EditModule />} />
        <Route path="modules/:id" element={<ModuleDetails />} />

        <Route path="lessons" element={<LessonList />} />
        <Route path="lessons/add" element={<AddLesson />} />
        <Route path="lessons/edit/:id" element={<EditLesson />} />
        <Route path="lessons/:id" element={<LessonDetails />} /> */}

        {/* Instructor Assignment / Assessment Engine */}
        {/* <Route path="assignments/create" element={<AssessmentCreatePage />} />
        <Route path="assignments/:id" element={<AssessmentDetailsPage />} /> */}
      </Route>
    </Routes>
  );
}

export default InstructorRoutes;