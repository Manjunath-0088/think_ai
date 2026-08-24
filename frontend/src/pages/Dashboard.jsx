import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { getCourses } from "../api/courseApi";
import { getBatches } from "../api/batchApi";
import { getEnrollments } from "../api/enrollmentApi";

function Dashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    batches: 0,
    enrollments: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [coursesRes, batchesRes, enrollmentsRes] =
        await Promise.all([
          getCourses(),
          getBatches(),
          getEnrollments(),
        ]);

      setStats({
        courses: coursesRes.data.data.length,
        batches: batchesRes.data.data.length,
        enrollments: enrollmentsRes.data.data.length,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>

        <p className="text-gray-400 mt-2">
          Welcome to Thinkz AI Learning Management System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Link
          to="/admin/courses"
          className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-6 hover:border-cyan-500 hover:scale-105 transition-all duration-300"
        >
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-400 text-sm">
                Total Courses
              </p>

              <h2 className="text-5xl font-bold text-cyan-400 mt-4">
                {stats.courses}
              </h2>
            </div>

            <div className="w-16 h-16 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <FaBook className="text-3xl text-cyan-400" />
            </div>

          </div>
        </Link>

        <Link
          to="/admin/batches"
          className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-6 hover:border-green-500 hover:scale-105 transition-all duration-300"
        >
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-400 text-sm">
                Total Batches
              </p>

              <h2 className="text-5xl font-bold text-green-400 mt-4">
                {stats.batches}
              </h2>
            </div>

            <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center">
              <FaUsers className="text-3xl text-green-400" />
            </div>

          </div>
        </Link>

        <Link
          to="/admin/enrollments"
          className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-6 hover:border-purple-500 hover:scale-105 transition-all duration-300"
        >
          <div className="flex justify-between items-center">

            <div>
              <p className="text-gray-400 text-sm">
                Total Enrollments
              </p>

              <h2 className="text-5xl font-bold text-purple-400 mt-4">
                {stats.enrollments}
              </h2>
            </div>

            <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FaUserGraduate className="text-3xl text-purple-400" />
            </div>

          </div>
        </Link>

      </div>

    </div>
  );
}

export default Dashboard;