/**
 * Claims API — RTK Query endpoints for student claims
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ktu-activity-points-backend-2.onrender.com/api/v1';

export const claimApi = createApi({
  reducerPath: 'claimApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/claims`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Claims', 'Score'],
  endpoints: (builder) => ({
    listClaims: builder.query({
      query: (params) => ({
        url: '/',
        params,
      }),
      providesTags: ['Claims'],
    }),
    getClaim: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Claims', id }],
    }),
    createClaim: builder.mutation({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Claims'],
    }),
    updateClaim: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Claims', id }],
    }),
    submitClaim: builder.mutation({
      query: (id) => ({
        url: `/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Claims'],
    }),
    withdrawClaim: builder.mutation({
      query: (id) => ({
        url: `/${id}/withdraw`,
        method: 'POST',
      }),
      invalidatesTags: ['Claims'],
    }),
    getClaimHistory: builder.query({
      query: (id) => `/${id}/history`,
    }),
    getMyScore: builder.query({
      query: () => '/me/score',
      providesTags: ['Score'],
    }),
    uploadAttachment: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/${id}/attachments`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Claims', id }],
    }),
    removeAttachment: builder.mutation({
      query: ({ id, attachmentId }) => ({
        url: `/${id}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Claims', id }],
    }),
    getAttachmentUrl: builder.query({
      query: (attachmentId) => `/attachments/${attachmentId}`,
    }),
  }),
});

export const {
  useListClaimsQuery,
  useGetClaimQuery,
  useCreateClaimMutation,
  useUpdateClaimMutation,
  useSubmitClaimMutation,
  useWithdrawClaimMutation,
  useGetClaimHistoryQuery,
  useGetMyScoreQuery,
  useUploadAttachmentMutation,
  useRemoveAttachmentMutation,
  useGetAttachmentUrlQuery,
  useLazyGetAttachmentUrlQuery,
} = claimApi;
