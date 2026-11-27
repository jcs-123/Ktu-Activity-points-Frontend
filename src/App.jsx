/**
 * Main App — Routing and Layout
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Provider } from 'react-redux';
import theme from './theme/theme';
import store from './app/store';

// Eagerly loaded core & admin user pages for instant load
import LoginPage from './features/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import AuthInitializer from './features/auth/AuthInitializer';
import UserAdmin from './features/admin/UserAdmin';

// Lazy-loaded pages to reduce initial bundle size and speed up page load
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const StudentDashboard = lazy(() => import('./features/student/StudentDashboard'));
const ClaimWizard = lazy(() => import('./features/claim/ClaimWizard'));
const MyClaims = lazy(() => import('./features/claim/MyClaims'));
const ClaimDetail = lazy(() => import('./features/claim/ClaimDetail'));
const MyReport = lazy(() => import('./features/claim/MyReport'));
const SFADashboard = lazy(() => import('./features/sfa/SFADashboard'));
const ReviewQueue = lazy(() => import('./features/sfa/ReviewQueue'));
const ClaimReviewDetail = lazy(() => import('./features/sfa/ClaimReviewDetail'));
const Leaderboard = lazy(() => import('./features/report/Leaderboard'));
const DeficiencyReport = lazy(() => import('./features/report/DeficiencyReport'));
const ClassReport = lazy(() => import('./features/report/ClassReport'));
const PrincipalDashboard = lazy(() => import('./features/report/PrincipalDashboard'));
const AnalyticsPage = lazy(() => import('./features/report/AnalyticsPage'));
const NotificationList = lazy(() => import('./features/notification/NotificationList'));
const SemesterConfig = lazy(() => import('./features/admin/SemesterConfig'));
const AuditLogView = lazy(() => import('./features/admin/AuditLogView'));
const CatalogueAdmin = lazy(() => import('./features/admin/CatalogueAdmin'));
const AllClaimsAdmin = lazy(() => import('./features/admin/AllClaimsAdmin'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <CircularProgress size={32} />
  </Box>
);

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthInitializer>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Authenticated — wrapped in layout */}
                <Route element={<AppLayout />}>
                  {/* Student */}
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/claims" element={<MyClaims />} />
                  <Route path="/claims/new" element={<ClaimWizard />} />
                  <Route path="/claims/:id" element={<ClaimDetail />} />
                  <Route path="/my-report" element={<MyReport />} />

                  {/* SFA */}
                  <Route path="/sfa/dashboard" element={<SFADashboard />} />
                  <Route path="/review" element={<ReviewQueue />} />
                  <Route path="/review/:id" element={<ClaimReviewDetail />} />

                  {/* Reports */}
                  <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
                  <Route path="/reports/class/:id" element={<ClassReport />} />
                  <Route path="/reports/student/:id" element={<PlaceholderPage title="Student Report" />} />
                  <Route path="/reports/deficiency" element={<DeficiencyReport />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />

                  {/* Admin */}
                  <Route path="/admin/claims" element={<AllClaimsAdmin />} />
                  <Route path="/admin/catalogue" element={<CatalogueAdmin />} />
                  <Route path="/admin/users" element={<UserAdmin />} />
                  <Route path="/admin/semesters" element={<SemesterConfig />} />
                  <Route path="/admin/audit" element={<AuditLogView />} />

                  {/* Notifications */}
                  <Route path="/notifications" element={<NotificationList />} />
                </Route>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AuthInitializer>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

// Temporary placeholder for pages not yet built
function PlaceholderPage({ title }) {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <h2 style={{ color: '#1F3864', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#666' }}>This page is under construction. Coming soon!</p>
    </Box>
  );
}

export default App;
