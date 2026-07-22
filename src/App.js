import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const EmailVerifyPage = lazy(() => import('./pages/EmailVerifyPage'));
const TwoFactorSetupPage = lazy(() => import('./pages/TwoFactorSetupPage'));
const AuthenticatedLayout = lazy(() => import('./components/layout/AuthenticatedLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const PrecautionsPage = lazy(() => import('./pages/PrecautionsPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ModelOpsPage = lazy(() => import('./pages/ModelOpsPage'));

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Suspense fallback={<div className="route-loading">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerifyPage />} />
          <Route path="/setup-2fa" element={<TwoFactorSetupPage />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/precautions" element={<PrecautionsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/model-ops" element={<ModelOpsPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
