import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCourseById, updateCourse } from "../../api/courseApi";

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    thumbnail: "",
    status: "ACTIVE",
  });

  const loadCourse = async () => {
    try {
      const response = await getCourseById(id);

      const data = response.data.data;

      setCourse({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        duration: data.duration,
        thumbnail: data.thumbnail,
        status: data.status,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load course");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCourse();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCourse({
      ...course,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateCourse(id, course);

      toast.success("Course Updated Successfully");

      navigate("/courses");
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.log(error.response.data);
      }

      toast.error("Update Failed");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-8">

      <h1 className="text-3xl font-bold mb-6">
        Edit Course
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-5"
      >

        <input
          type="text"
          name="title"
          placeholder="Course Title"
          value={course.title}
          onChange={handleChange}
          className="border p-3 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={course.description}
          onChange={handleChange}
          className="border p-3 rounded col-span-2"
          rows={4}
          required
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={course.category}
          onChange={handleChange}
          className="border p-3 rounded"
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={course.price}
          onChange={handleChange}
          className="border p-3 rounded"
          required
        />

        <input
          type="text"
          name="duration"
          placeholder="Duration"
          value={course.duration}
          onChange={handleChange}
          className="border p-3 rounded"
          required
        />

        <input
          type="text"
          name="thumbnail"
          placeholder="Thumbnail URL"
          value={course.thumbnail}
          onChange={handleChange}
          className="border p-3 rounded col-span-2"
        />

        <select
          name="status"
          value={course.status}
          onChange={handleChange}
          className="border p-3 rounded col-span-2"
          required
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded col-span-2"
        >
          Update Course
        </button>
      </form>

    </div>
  );
}

export default EditCourse;