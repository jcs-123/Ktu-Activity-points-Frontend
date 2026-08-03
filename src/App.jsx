/**
 * Main App — Routing and Layout
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import theme from './theme/theme';
import store from './app/store';

// Pages
import LoginPage from './features/auth/LoginPage';
import StudentDashboard from './features/student/StudentDashboard';
import ClaimWizard from './features/claim/ClaimWizard';
import MyClaims from './features/claim/MyClaims';
import ClaimDetail from './features/claim/ClaimDetail';
import MyReport from './features/claim/MyReport';
import SFADashboard from './features/sfa/SFADashboard';
import ReviewQueue from './features/sfa/ReviewQueue';
import ClaimReviewDetail from './features/sfa/ClaimReviewDetail';
import Leaderboard from './features/report/Leaderboard';
import DeficiencyReport from './features/report/DeficiencyReport';
import ClassReport from './features/report/ClassReport';
import PrincipalDashboard from './features/report/PrincipalDashboard';
import AnalyticsPage from './features/report/AnalyticsPage';
import NotificationList from './features/notification/NotificationList';

// Layout
import AppLayout from './components/layout/AppLayout';
import AuthInitializer from './features/auth/AuthInitializer';

// Admin
import UserAdmin from './features/admin/UserAdmin';
import SemesterConfig from './features/admin/SemesterConfig';
import AuditLogView from './features/admin/AuditLogView';
import CatalogueAdmin from './features/admin/CatalogueAdmin';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthInitializer>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

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
          </AuthInitializer>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

// Temporary placeholder for pages not yet built
function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#1F3864' }}>{title}</h2>
      <p style={{ color: '#666' }}>This page is under construction. Coming soon!</p>
    </div>
  );
}

export default App;
