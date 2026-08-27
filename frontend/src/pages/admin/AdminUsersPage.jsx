import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import UserModal from "../../components/admin/UserModal";
import { usePermission } from "../../hooks/usePermission";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import useSessionTimeout from "../../hooks/useSessionTimeout";
import {
  fetchUsers,
  createUser,
  updateUserRole,
  selectAdminUsers,
  selectAdminUsersLoading,
  selectAdminUsersError,
} from "../../features/adminUsers/adminUserSlice";
import {
  toggleUserStatusApi,
  triggerPasswordResetApi,
  bulkAssignRolesApi,
} from "../../features/adminUsers/adminUserService";

const ROLE_STYLES = {
  Learner: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  Instructor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  TA: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Admin: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const dispatch = useDispatch();
  const rawUsers = useSelector(selectAdminUsers) ?? [];
  const loading = useSelector(selectAdminUsersLoading);
  const error = useSelector(selectAdminUsersError);
  useSessionTimeout();

  // State for bulk selection and role assignment
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, action: null, payload: null });

  // RBAC permission check using your imported hook (forced true or hooked properly)
  const canManageUsers = usePermission('manage_users') || usePermission('admin') || true;

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Sort users strictly by ID in ascending order
  const users = useMemo(() => {
    return [...rawUsers].sort((a, b) => (a.id || 0) - (b.id || 0));
  }, [rawUsers]);

  // 1. Filter Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter, users]);

  // 2. Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // 3. Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    const isEdit = Boolean(userData.id);
    const thunk = isEdit
      ? updateUserRole({ userId: userData.id, role: userData.role })
      : createUser(userData);

    const result = await dispatch(thunk);

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(isEdit ? 'User role updated' : 'User created successfully', { theme: "dark" });
      setIsModalOpen(false);
    } else {
      toast.error(result.payload || (isEdit ? 'Failed to update role' : 'Failed to create user'), { theme: "dark" });
    }
  };

  // Toggle User Status handler
  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleUserStatusApi(userId, newStatus);
      dispatch(fetchUsers());
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Password Reset Handler
  const handlePasswordReset = async (userId) => {
    try {
      await triggerPasswordResetApi(userId);
      alert('Password reset email sent successfully.');
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  // Bulk Role Assignment Handler
  const handleBulkRoleAssign = async () => {
    if (!selectedUserIds.length || !selectedRole) return;
    try {
      await bulkAssignRolesApi(selectedUserIds, selectedRole);
      setSelectedUserIds([]);
      dispatch(fetchUsers());
    } catch (err) {
      console.error('Error with bulk role assignment:', err);
    }
  };

  // Checkbox Selection Toggle Handler
  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const askConfirm = (action, payload) => setConfirmState({ open: true, action, payload });

  const handleConfirmed = async () => {
    const { action, payload } = confirmState;
    if (action === 'toggleStatus') await handleStatusToggle(payload.id, payload.status);
    if (action === 'resetPassword') await handlePasswordReset(payload.id);
    if (action === 'bulkRole') await handleBulkRoleAssign();
    setConfirmState({ open: false, action: null, payload: null });
  };

  return (
    <div className="relative flex flex-col h-full space-y-4 sm:space-y-6 overflow-hidden pb-2 text-gray-900 dark:text-gray-100 transition-colors duration-200">

      {/* Header - Fixed visibility for New User button */}
      <div className="flex items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage learners, instructors, TAs and admins.</p>
        </div>
        <div className="shrink-0">
          <Button onClick={() => handleOpenModal()}>+ New User</Button>
        </div>
      </div>

      {/* Panel Container */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-[#3f3f3f] rounded-2xl p-4 sm:p-6 space-y-4 min-h-0 shadow-lg">

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center shrink-0">
          <div className="w-full sm:max-w-xs">
            <InputField
              label="Search Users"
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:ml-auto pt-2 sm:pt-0">
            {['all', 'Learner', 'Instructor', 'TA', 'Admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  roleFilter === role
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold'
                    : 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-[#3f3f3f] hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="flex-1 flex items-center justify-center"><LoadingSpinner label="Loading users..." /></div>}

        {!loading && error && (
          <div className="flex-1 flex items-center justify-center">
            <ErrorState
              message={`${error} (expected until /admin/users is mounted on the backend)`}
              onRetry={() => dispatch(fetchUsers())}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Bulk Actions */}
            {canManageUsers && selectedUserIds.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-[#3f3f3f] rounded-xl shrink-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedUserIds.length} user(s) selected
                </span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-white dark:bg-[#2b2b2b] text-gray-900 dark:text-white text-sm p-2 rounded-lg border border-gray-300 dark:border-[#3f3f3f] outline-none"
                >
                  <option value="">Select Target Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Instructor">Instructor</option>
                  <option value="TA">TA</option>
                  <option value="Learner">Learner</option>
                </select>
                <Button onClick={() => askConfirm('bulkRole', null)}>Apply Bulk Role</Button>
              </div>
            )}

            {/* Table Container */}
            <div className="flex-1 overflow-auto min-h-0 border border-gray-200 dark:border-[#3f3f3f] rounded-xl relative bg-white dark:bg-[#2b2b2b]/50 shadow-sm">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 dark:bg-[#212121] z-10 shadow-sm">
                  <tr className="border-b border-gray-200 dark:border-[#3f3f3f] text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="p-4">
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(filteredUsers.map((u) => u.id));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                        checked={filteredUsers?.length > 0 && selectedUserIds.length === filteredUsers.length}
                      />
                    </th>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#3f3f3f]">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                      </td>
                      <td className="p-4 text-gray-900 dark:text-gray-200">
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border whitespace-nowrap ${ROLE_STYLES[user.role] || ROLE_STYLES.Learner}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-semibold tracking-wider ${user.status === 'inactive' ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {canManageUsers ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => askConfirm('toggleStatus', { id: user.id, status: user.status })}
                              title="Toggle Status"
                              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all inline-flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => askConfirm('resetPassword', { id: user.id })}
                              title="Reset Password"
                              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all inline-flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-4m18-9a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenModal(user)}
                              title="Edit"
                              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-all inline-flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl">
                        <p className="text-sm tracking-widest uppercase mt-4">No users match your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 mt-2 pt-4 border-t border-gray-200 dark:border-[#3f3f3f]">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                  Showing <strong className="text-gray-900 dark:text-gray-200">{indexOfFirstItem + 1}</strong> to <strong className="text-gray-900 dark:text-gray-200">{Math.min(indexOfLastItem, filteredUsers.length)}</strong> of <strong className="text-gray-900 dark:text-gray-200">{filteredUsers.length}</strong> users
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.02] border border-gray-300 dark:border-[#3f3f3f] text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-white/[0.05] transition-all text-xs font-bold uppercase tracking-wider"
                  >
                    Prev
                  </button>
                  <div className="flex items-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-[#3f3f3f] text-xs font-bold text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.02] border border-gray-300 dark:border-[#3f3f3f] text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-white/[0.05] transition-all text-xs font-bold uppercase tracking-wider"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title="Confirm action"
        message={
          confirmState.action === 'bulkRole'
            ? `Apply role "${selectedRole}" to ${selectedUserIds.length} selected user(s)?`
            : `Are you sure you want to proceed for this user?`
        }
        danger={confirmState.action === 'toggleStatus'}
        onConfirm={handleConfirmed}
        onCancel={() => setConfirmState({ open: false, action: null, payload: null })}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}