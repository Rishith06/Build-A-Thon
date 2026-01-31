import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Scanner from './pages/Scanner';
import ProtectedRoute from './components/ProtectedRoute';

import CoordinatorPanel from './pages/CoordinatorPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/coordinator" 
          element={
            <ProtectedRoute>
              <CoordinatorPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scanner" 
          element={
            <ProtectedRoute>
              <Scanner />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
