/**
 * AuthInitializer — Restores auth state on page refresh.
 * Calls /auth/me using the httpOnly cookie that persists in the browser.
 * Renders children immediately (no blocking splash screen).
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from '../../api/authApi';
import { setCredentials, clearCredentials, setLoading } from './authSlice';

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const token = localStorage.getItem('accessToken');

  // Verify and hydrate session if token is stored in localStorage
  const { data, isSuccess, isError, isLoading } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch(setLoading(true));
      return;
    }

    if (isSuccess && data) {
      // data may be wrapped: { user, roles, roleAssignments } or { data: { ... } }
      const payload = data.user ? data : data.data || data;
      dispatch(setCredentials({
        user: payload.user || payload,
        roles: payload.roles || payload.user?.roles || [],
        roleAssignments: payload.roleAssignments || [],
      }));
    }

    if (isError) {
      // Cookie invalid / expired — clear state
      dispatch(clearCredentials());
    }
  }, [isSuccess, isError, isLoading, data, dispatch]);

  return children;
};

export default AuthInitializer;
