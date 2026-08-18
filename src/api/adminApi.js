/**
 * Admin API — RTK Query endpoints for administrative configurations
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ktu-activity-points-backend-2.onrender.com/api/v1';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/admin`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminUsers', 'AdminClasses', 'AdminDepartments', 'AdminBatches', 'AdminSemesters', 'AdminSettings'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['AdminUsers'],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    bulkImportStudents: builder.mutation({
      query: (body) => ({
        url: '/users/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    getClasses: builder.query({
      query: () => '/classes',
      providesTags: ['AdminClasses'],
    }),
    createClass: builder.mutation({
      query: (body) => ({
        url: '/classes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminClasses'],
    }),
    getDepartments: builder.query({
      query: () => '/departments',
      providesTags: ['AdminDepartments'],
    }),
    createDepartment: builder.mutation({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminDepartments'],
    }),
    getBatches: builder.query({
      query: () => '/batches',
      providesTags: ['AdminBatches'],
    }),
    createBatch: builder.mutation({
      query: (body) => ({
        url: '/batches',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminBatches'],
    }),
    getSemesters: builder.query({
      query: () => '/semesters',
      providesTags: ['AdminSemesters'],
    }),
    createSemester: builder.mutation({
      query: (body) => ({
        url: '/semesters',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminSemesters'],
    }),
    createRoleAssignment: builder.mutation({
      query: (body) => ({
        url: '/role-assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    getRoleAssignments: builder.query({
      query: () => '/role-assignments',
      providesTags: ['AdminUsers'],
    }),
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['AdminSettings'],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({
        url: '/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminSettings'],
    }),
    getAuditLogs: builder.query({
      query: (params) => ({
        url: '/audit-log',
        params,
      }),
      providesTags: ['AdminAuditLogs'],
    }),
    recomputeScores: builder.mutation({
      query: (body) => ({
        url: '/scores/recompute',
        method: 'POST',
        body,
      }),
    }),
    updateHead: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/catalogue/heads/${id}`,
        method: 'PATCH',
        body,
      }),
    }),
    updateItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/catalogue/items/${id}`,
        method: 'PATCH',
        body,
      }),
    }),
    updateOption: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/catalogue/options/${id}`,
        method: 'PATCH',
        body,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useBulkImportStudentsMutation,
  useGetClassesQuery,
  useCreateClassMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetBatchesQuery,
  useCreateBatchMutation,
  useGetSemestersQuery,
  useCreateSemesterMutation,
  useCreateRoleAssignmentMutation,
  useGetRoleAssignmentsQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetAuditLogsQuery,
  useRecomputeScoresMutation,
  useUpdateHeadMutation,
  useUpdateItemMutation,
  useUpdateOptionMutation,
} = adminApi;
