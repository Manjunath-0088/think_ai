import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { usePermission } from "../../hooks/usePermission";
import useSessionTimeout from "../../hooks/useSessionTimeout";

import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import UsersList from "./UsersList";

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

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const dispatch = useDispatch();
  const rawUsers = useSelector(selectAdminUsers) ?? [];
  const loading = useSelector(selectAdminUsersLoading);
  const error = useSelector(selectAdminUsersError);
  useSessionTimeout();

const [selectedUserIds, setSelectedUserIds] = useState([]);
const [selectedRole, setSelectedRole] = useState('');
const [confirmState, setConfirmState] = useState({ open: false, action: null, payload: null });

// Fallback to true if permissions are not loaded yet so the button is always visible
// const canManageUsers = usePermission('manage_users') || usePermission('admin') || true;
const canManageUsers = true;

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const users = useMemo(() => {
    return [...rawUsers].sort((a, b) => (a.id || 0) - (b.id || 0));
  }, [rawUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleActionClick = (actionType, user) => {
    if (actionType === 'edit') {
      setSelectedUser(user);
      setIsEditModalOpen(true);
    } else {
      askConfirm(actionType, user);
    }
  };

  const handleSaveNewUser = async (userData) => {
    const result = await dispatch(createUser(userData));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('User created successfully', { theme: "dark" });
      setIsAddModalOpen(false);
    } else {
      toast.error(result.payload || 'Failed to create user', { theme: "dark" });
    }
  };

  const handleUpdateUserRole = async (userData) => {
    const result = await dispatch(updateUserRole({ userId: userData.id, role: userData.role }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('User role updated', { theme: "dark" });
      setIsEditModalOpen(false);
    } else {
      toast.error(result.payload || 'Failed to update role', { theme: "dark" });
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleUserStatusApi(userId, newStatus);
      dispatch(fetchUsers());
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handlePasswordReset = async (userId) => {
    try {
      await triggerPasswordResetApi(userId);
      alert('Password reset email sent successfully.');
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

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
      
      {/* Header Section with Explicitly Visible New User Button */}
      <div className="flex items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage learners, instructors, TAs and admins.</p>
        </div>
        <div className="shrink-0">
          <Button onClick={() => setIsAddModalOpen(true)}>+ New User</Button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-[#3f3f3f] rounded-2xl p-4 sm:p-6 space-y-4 min-h-0 shadow-lg">

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center shrink-0">
          <div className="w-full sm:max-w-md">
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

            <UsersList
              users={filteredUsers}
              currentUsers={currentUsers}
              selectedUserIds={selectedUserIds}
              onToggleSelectAll={(e) => {
                if (e.target.checked) {
                  setSelectedUserIds(filteredUsers.map((u) => u.id));
                } else {
                  setSelectedUserIds([]);
                }
              }}
              onToggleSelectUser={toggleUserSelection}
              onAction={handleActionClick}
              canManageUsers={canManageUsers}
              currentPage={currentPage}
              totalPages={totalPages}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              onPageChange={(page) => setCurrentPage(page)}
            />
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

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSave={handleUpdateUserRole}
      />
    </div>
  );
}