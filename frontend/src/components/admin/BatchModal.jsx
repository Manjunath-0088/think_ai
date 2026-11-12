import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import Button from '../common/Button';

/* eslint-disable react-hooks/set-state-in-effect */

const EMPTY_BATCH = {
  batchName: '',
  courseId: '',
  trainerName: '',
  startDate: '',
  endDate: '',
  timing: '',
  mode: 'Online',
  capacity: '',
  enrolledCount: 0,
  status: 'ACTIVE',
};

export default function BatchModal({ isOpen, onClose, batch, onSave }) {
  const [formData, setFormData] = useState(EMPTY_BATCH);

  useEffect(() => {
    if (batch) {
      setFormData({ ...EMPTY_BATCH, ...batch });
    } else {
      setFormData(EMPTY_BATCH);
    }
  }, [batch, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={batch ? 'Edit Batch' : 'Add New Batch'}>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <InputField
          label="Batch Name"
          id="batchName"
          name="batchName"
          type="text"
          value={formData.batchName}
          onChange={handleChange}
          placeholder="e.g. Node.js August Batch"
          required
        />

        <InputField
          label="Course ID"
          id="courseId"
          name="courseId"
          type="number"
          value={formData.courseId}
          onChange={handleChange}
          placeholder="e.g. 1"
          required
        />

        <InputField
          label="Trainer Name"
          id="trainerName"
          name="trainerName"
          type="text"
          value={formData.trainerName}
          onChange={handleChange}
          placeholder="e.g. John Doe"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
          <InputField
            label="End Date"
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>

        <InputField
          label="Timing"
          id="timing"
          name="timing"
          type="text"
          value={formData.timing}
          onChange={handleChange}
          placeholder="e.g. 10:00 AM - 12:00 PM"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mode" className="block text-sm font-medium text-gray-300 mb-1.5">Mode</label>
            <select
              id="mode"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              className="w-full bg-[#0D1220] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <InputField
            label="Capacity"
            id="capacity"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="e.g. 40"
          />
        </div>

        <InputField
          label="Enrolled Count"
          id="enrolledCount"
          name="enrolledCount"
          type="number"
          value={formData.enrolledCount}
          onChange={handleChange}
          placeholder="0"
        />

        <InputField
          label="Status"
          id="status"
          name="status"
          type="text"
          value={formData.status}
          onChange={handleChange}
          placeholder="ACTIVE"
        />

        <div className="pt-4 mt-2 flex items-center justify-end gap-3 border-t border-gray-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" label={batch ? 'Save Changes' : 'Create Batch'} />
        </div>
      </form>
    </Modal>
  );
}