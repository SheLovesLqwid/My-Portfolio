import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Risks from './pages/Risks';
import RiskForm from './pages/RiskForm';
import SoA from './pages/SoA';
import SoAForm from './pages/SoAForm';
import Audits from './pages/Audits';
import AuditForm from './pages/AuditForm';
import AuditDetail from './pages/AuditDetail';
import Policies from './pages/Policies';
import PolicyForm from './pages/PolicyForm';
import Users from './pages/Users';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="risks" element={<Risks />} />
              <Route path="risks/new" element={<RiskForm />} />
              <Route path="risks/:id/edit" element={<RiskForm />} />
              <Route path="soa" element={<SoA />} />
              <Route path="soa/new" element={<SoAForm />} />
              <Route path="soa/:id/edit" element={<SoAForm />} />
              <Route path="audits" element={<Audits />} />
              <Route path="audits/new" element={<AuditForm />} />
              <Route path="audits/:id" element={<AuditDetail />} />
              <Route path="audits/:id/edit" element={<AuditForm />} />
              <Route path="policies" element={<Policies />} />
              <Route path="policies/new" element={<PolicyForm />} />
              <Route path="policies/:id/edit" element={<PolicyForm />} />
              <Route path="users" element={<Users />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
