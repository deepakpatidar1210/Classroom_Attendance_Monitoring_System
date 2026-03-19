import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Sessions from './pages/Sessions';
import Students from './pages/students';
import Reports from './pages/reports';
import Teachers from './pages/Teachers';
import Rooms from './pages/Rooms';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Teacher routes */}
          <Route path="/teacher" element={
            <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
          }/>
          <Route path="/sessions" element={
            <ProtectedRoute role="teacher"><Sessions /></ProtectedRoute>
          }/>
          <Route path="/students" element={
            <ProtectedRoute role="teacher"><Students /></ProtectedRoute>
          }/>
          <Route path="/reports" element={
            <ProtectedRoute role="teacher"><Reports /></ProtectedRoute>
          }/>

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          }/>
          <Route path="/teachers" element={
            <ProtectedRoute role="admin"><Teachers /></ProtectedRoute>
          }/>
          <Route path="/rooms" element={
            <ProtectedRoute role="admin"><Rooms /></ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
