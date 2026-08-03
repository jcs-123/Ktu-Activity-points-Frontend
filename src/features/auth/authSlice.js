/**
 * Auth Slice — Redux state for authentication
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  roles: [],
  roleAssignments: [],
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.roles = action.payload.roles || [];
      state.roleAssignments = action.payload.roleAssignments || [];
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.roles = [];
      state.roleAssignments = [];
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRoles = (state) => state.auth.roles;
export const selectIsLoading = (state) => state.auth.isLoading;

// Check if user has a specific role
export const selectHasRole = (role) => (state) =>
  state.auth.roles.includes(role);

export default authSlice.reducer;
