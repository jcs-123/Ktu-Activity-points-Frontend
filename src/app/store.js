import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { claimApi } from '../api/claimApi';
import { catalogueApi } from '../api/catalogueApi';
import { reviewApi } from '../api/reviewApi';
import { reportApi } from '../api/reportApi';
import { adminApi } from '../api/adminApi';
import { notificationApi } from '../api/notificationApi';
import authReducer from '../features/auth/authSlice';
import claimWizardReducer from '../features/claim/claimWizardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    claimWizard: claimWizardReducer,
    [authApi.reducerPath]: authApi.reducer,
    [claimApi.reducerPath]: claimApi.reducer,
    [catalogueApi.reducerPath]: catalogueApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(claimApi.middleware)
      .concat(catalogueApi.middleware)
      .concat(reviewApi.middleware)
      .concat(reportApi.middleware)
      .concat(adminApi.middleware)
      .concat(notificationApi.middleware),
});

export default store;
