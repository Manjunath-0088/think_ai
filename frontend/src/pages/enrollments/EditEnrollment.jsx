import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getEnrollmentById, updateEnrollment } from "../../api/enrollmentApi";
import { getBatches } from "../../api/batchApi";

function EditEnrollment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const [enrollment, setEnrollment] = useState({
    studentName: "",
    studentEmail: "",
    batchId: "",
    enrollmentStatus: "ENROLLED",
  });

  useEffect(() => {
    loadBatches();
    loadEnrollment();
  }, [id]);

  const loadBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await getBatches();
      setBatches(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadEnrollment = async () => {
    try {
      const response = await getEnrollmentById(id);
      const data = response.data.data;

      setEnrollment({
        studentName: data.studentName || "",
        studentEmail: data.studentEmail || "",
        batchId: data.batchId || data.batch?.id || "",
        enrollmentStatus: data.enrollmentStatus || "ACTIVE",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load enrollment");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEnrollment({
      ...enrollment,
      [name]: name === "batchId" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        studentName: enrollment.studentName,
        studentEmail: enrollment.studentEmail,
        batchId: Number(enrollment.batchId),
        enrollmentStatus: enrollment.enrollmentStatus,
      };

      await updateEnrollment(id, payload);

      toast.success("Enrollment Updated Successfully");

      navigate("/admin/enrollments");
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.log(error.response.data);
      }

      toast.error("Failed to Update Enrollment");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">

      <div className="flex justify-between items-center mb-7">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Edit Enrollment
          </h1>

          <p className="text-gray-400 mt-1">
            Update enrollment information.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#1A1F2B] border border-gray-800 rounded-2xl p-8 grid grid-cols-2 gap-6"
      >

        <input
          type="text"
          name="studentName"
          placeholder="Student Name"
          value={enrollment.studentName}
          onChange={handleChange}
          className="bg-[#0B0F19] border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          required
        />

        <input
          type="email"
          name="studentEmail"
          placeholder="Student Email"
          value={enrollment.studentEmail}
          onChange={handleChange}
          className="bg-[#0B0F19] border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          required
        />

        <select
          name="batchId"
          value={enrollment.batchId}
          onChange={handleChange}
          className="bg-[#0B0F19] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
          required
          disabled={loadingBatches}
        >
          <option value="">
            {loadingBatches ? "Loading batches..." : "Select Batch"}
          </option>

          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>

        <select
          name="enrollmentStatus"
          value={enrollment.enrollmentStatus}
          onChange={handleChange}
          className="bg-[#0B0F19] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="ENROLLED">ENROLLED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <div className="col-span-2 flex justify-center pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 text-sm font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-white border-0 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 uppercase tracking-wider"
          >
            Update Enrollment
          </button>
        </div>

      </form>
    </div>
  );
}

export default EditEnrollment;