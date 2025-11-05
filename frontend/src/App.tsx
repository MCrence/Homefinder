import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import ApartmentsPage from './pages/apartments/ApartmentsPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import Layout from './components/layout/Layout';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
      
      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/*" element={<Layout />}>  {/* Add wildcard */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="apartments" element={<ApartmentsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Updated ProtectedRoute component using Outlet
function ProtectedRoute({ user }: { user: any }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;  // Render child routes
}

export default App;