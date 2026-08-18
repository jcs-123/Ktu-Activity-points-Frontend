/**
 * Review API — RTK Query endpoints for SFA claim reviews
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/review`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ReviewQueue', 'ReviewClaim'],
  endpoints: (builder) => ({
    getReviewQueue: builder.query({
      query: (params) => ({
        url: '/queue',
        params,
      }),
      providesTags: ['ReviewQueue'],
    }),
    getClaimForReview: builder.query({
      query: (id) => `/claims/${id}`,
      providesTags: (result, error, id) => [{ type: 'ReviewClaim', id }],
    }),
    openClaim: builder.mutation({
      query: (id) => ({
        url: `/claims/${id}/open`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ReviewClaim', id },
        'ReviewQueue',
      ],
    }),
    approveClaim: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/claims/${id}/approve`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReviewClaim', id },
        'ReviewQueue',
      ],
    }),
    rejectClaim: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/claims/${id}/reject`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReviewClaim', id },
        'ReviewQueue',
      ],
    }),
    revertClaim: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/claims/${id}/revert`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ReviewClaim', id },
        'ReviewQueue',
      ],
    }),
    bulkApprove: builder.mutation({
      query: (claimIds) => ({
        url: '/bulk-approve',
        method: 'POST',
        body: { claimIds },
      }),
      invalidatesTags: ['ReviewQueue'],
    }),
    lockSemester: builder.mutation({
      query: ({ semesterId, classId }) => ({
        url: `/semesters/${semesterId}/lock`,
        method: 'POST',
        body: { classId },
      }),
    }),
    getSFADashboardMetrics: builder.query({
      query: () => '/dashboard-metrics',
      providesTags: ['ReviewQueue'],
    }),
  }),
});

export const {
  useGetReviewQueueQuery,
  useGetClaimForReviewQuery,
  useOpenClaimMutation,
  useApproveClaimMutation,
  useRejectClaimMutation,
  useRevertClaimMutation,
  useBulkApproveMutation,
  useLockSemesterMutation,
  useGetSFADashboardMetricsQuery,
} = reviewApi;
