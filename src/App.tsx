import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Lazy-load every page so the initial bundle stays small and the Login page
// renders fast on mobile. Heavy libs (face-api.js, recharts, xlsx, jspdf)
// only load when their page is visited.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RegisterStudentPage = lazy(() => import('./pages/RegisterStudentPage'));
const AttendanceSessionPage = lazy(() => import('./pages/AttendanceSessionPage'));
const LiveAttendancePage = lazy(() => import('./pages/LiveAttendancePage'));
const AttendanceRecordsPage = lazy(() => import('./pages/AttendanceRecordsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/register" element={<RegisterStudentPage />} />
                    <Route path="/sessions" element={<AttendanceSessionPage />} />
                    <Route path="/live" element={<LiveAttendancePage />} />
                    <Route path="/records" element={<AttendanceRecordsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                  {/* Unknown routes go to Login, not a protected route, so
                      unauthenticated mobile visitors aren't trapped on a
                      spinner while auth resolves. */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
