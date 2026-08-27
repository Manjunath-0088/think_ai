import React, { useState } from 'react';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

export default function AddUserModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Learner', password: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-[#3f3f3f] w-full max-w-md rounded-2xl p-6 shadow-2xl text-gray-900 dark:text-gray-100">
        <h2 className="text-xl font-bold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <InputField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-gray-50 dark:bg-[#212121] border border-gray-300 dark:border-[#3f3f3f] rounded-xl p-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500"
            >
              <option value="Learner">Learner</option>
              <option value="Instructor">Instructor</option>
              <option value="TA">TA</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <InputField
            label="Temporary Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#212121] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3f3f3f] transition"
            >
              Cancel
            </button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </div>
    </div>
  );
}