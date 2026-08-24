import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import { selectHasPermission } from '../../features/rbac/rbacSlice';

export default function RequirePermission({ permission, fallback = null, children }) {
  const user = useSelector(selectUser);
  const hasPermission = useSelector(selectHasPermission(user?.role, permission));
  return hasPermission ? children : fallback;
}