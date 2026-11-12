import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBatchById } from "../../api/batchApi";

function BatchDetails() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);

  const loadBatch = async () => {
    try {
      const response = await getBatchById(id);
      setBatch(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBatch();
  }, []);

  if (!batch) {
    return (
      <div className="text-center mt-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-8">

      <h1 className="text-3xl font-bold mb-6">
        Batch Details
      </h1>

      <div className="grid grid-cols-2 gap-5">

        <div>
          <strong>Batch Name</strong>
          <p>{batch.name}</p>
        </div>

        <div>
          <strong>Course</strong>
          <p>{batch.course?.title}</p>
        </div>

        <div>
          <strong>Instructor</strong>
          <p>{batch.instructorName}</p>
        </div>

        <div>
          <strong>Capacity</strong>
          <p>{batch.capacity}</p>
        </div>

        <div>
          <strong>Start Date</strong>
          <p>{new Date(batch.startDate).toLocaleDateString()}</p>
        </div>

        <div>
          <strong>End Date</strong>
          <p>{new Date(batch.endDate).toLocaleDateString()}</p>
        </div>

        <div>
          <strong>Status</strong>
          <p>{batch.status}</p>
        </div>

        <div>
          <strong>Enrolled Count</strong>
          <p>{batch.enrolledCount}</p>
        </div>

      </div>

    </div>
  );
}

export default BatchDetails;