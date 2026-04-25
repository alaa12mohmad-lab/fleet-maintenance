// src/App.jsx
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FullPageLoader } from './components/Common'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import EquipmentPage from './pages/Equipment'
import Vehicles from './pages/Vehicles'
import MeterReadings from './pages/MeterReadings'
import Profile from './pages/Profile'
import Maintenance from './pages/Maintenance'
import OilChanges from './pages/OilChanges'
import Documents from './pages/Documents'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'
import AdminUsers from './pages/admin/Users'
import Invitations from './pages/admin/Invitations'
import Permissions from './pages/admin/Permissions'

// Route Guard
function ProtectedRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!currentUser) return <Navigate to="/login" replace />
  if (!userProfile) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="card text-center max-w-sm">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-lg font-bold text-white mb-2">حساب غير مفعّل</h2>
        <p className="text-slate-400 text-sm">حسابك غير نشط أو لا يوجد ملف تعريف. تواصل مع المدير.</p>
        <button onClick={() => { import('./firebase/auth').then(m => m.logoutUser()) }}
          className="btn-secondary mt-4 w-full justify-center">تسجيل الخروج</button>
      </div>
    </div>
  )
  return children
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { currentUser } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="equipment" element={<EquipmentPage itemType="equipment" />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="oil-changes" element={<OilChanges />} />
        <Route path="meter-readings" element={<MeterReadings />} />
        <Route path="documents" element={<Documents />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />

        {/* Admin Routes */}
        <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="admin/invitations" element={<AdminRoute><Invitations /></AdminRoute>} />
        <Route path="admin/permissions" element={<AdminRoute><Permissions /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
