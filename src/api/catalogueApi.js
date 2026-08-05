/**
 * Catalogue API — RTK Query endpoints for browsing activity catalogue
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ktu-activity-points-backend-2.onrender.com/api/v1';

export const catalogueApi = createApi({
  reducerPath: 'catalogueApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/catalogue`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Catalogue'],
  endpoints: (builder) => ({
    getGroups: builder.query({
      query: () => '/groups',
      transformResponse: (response) => response.data,
      providesTags: ['Catalogue'],
    }),
    getHeadsByGroup: builder.query({
      query: (groupId) => `/groups/${groupId}/heads`,
      transformResponse: (response) => response.data,
      providesTags: ['Catalogue'],
    }),
    getItemsByHead: builder.query({
      query: (headId) => `/heads/${headId}/items`,
      transformResponse: (response) => response.data,
      providesTags: ['Catalogue'],
    }),
    getItemDetail: builder.query({
      query: (itemId) => `/items/${itemId}`,
      transformResponse: (response) => response.data,
      providesTags: ['Catalogue'],
    }),
    getOptionsByItem: builder.query({
      query: (itemId) => `/items/${itemId}/options`,
      transformResponse: (response) => response.data,
      providesTags: ['Catalogue'],
    }),
    searchSkillingCourses: builder.query({
      query: (q) => `/skilling-courses?q=${q}`,
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetHeadsByGroupQuery,
  useGetItemsByHeadQuery,
  useGetItemDetailQuery,
  useGetOptionsByItemQuery,
  useSearchSkillingCoursesQuery,
} = catalogueApi;
