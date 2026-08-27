import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';

export default function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState('Learner');

  useEffect(() => {
    if (user) setRole(user.role || 'Learner');
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: user.id, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-[#3f3f3f] w-full max-w-md rounded-2xl p-6 shadow-2xl text-gray-900 dark:text-gray-100">
        <h2 className="text-xl font-bold mb-1">Edit User Role</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Updating access level for {user.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#212121] border border-gray-300 dark:border-[#3f3f3f] rounded-xl p-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500"
            >
              <option value="Learner">Learner</option>
              <option value="Instructor">Instructor</option>
              <option value="TA">TA</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#212121] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3f3f3f] transition"
            >
              Cancel
            </button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}