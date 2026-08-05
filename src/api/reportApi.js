/**
 * Report API — RTK Query endpoints for Leaderboard and Class Deficiency
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ktu-activity-points-backend-2.onrender.com/api/v1';

export const reportApi = createApi({
  reducerPath: 'reportApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/reports`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Leaderboard', 'Deficiency'],
  endpoints: (builder) => ({
    getLeaderboard: builder.query({
      query: () => '/leaderboard',
      providesTags: ['Leaderboard'],
    }),
    getClassDeficiency: builder.query({
      query: (classId) => `/class/${classId}/deficiency`,
      providesTags: ['Deficiency'],
    }),
    getClassConsolidatedReport: builder.query({
      query: (classId) => `/class/${classId}`,
      providesTags: ['ClassReport'],
    }),
    getStudentReport: builder.query({
      query: (studentId) => `/student/${studentId}`,
      providesTags: ['StudentReport'],
    }),
    getExecutiveSummary: builder.query({
      query: () => '/executive-summary',
      providesTags: ['ExecutiveSummary'],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useGetClassDeficiencyQuery,
  useGetClassConsolidatedReportQuery,
  useGetStudentReportQuery,
  useGetExecutiveSummaryQuery,
} = reportApi;
