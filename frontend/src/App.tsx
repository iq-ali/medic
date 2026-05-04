import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { SplashScreen } from './components/SplashScreen'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { StudentsPage } from './pages/students/StudentsPage'
import { StudentDetailPage } from './pages/students/StudentDetailPage'
import { StudentFormPage } from './pages/students/StudentFormPage'
import { StaffPage } from './pages/staff/StaffPage'
import { StaffDetailPage } from './pages/staff/StaffDetailPage'
import { StaffFormPage } from './pages/staff/StaffFormPage'
import { MedicalPage } from './pages/medical/MedicalPage'
import { MedicalDetailPage } from './pages/medical/MedicalDetailPage'
import { MedicalFormPage } from './pages/medical/MedicalFormPage'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { AppointmentDetailPage } from './pages/appointments/AppointmentDetailPage'
import { AppointmentFormPage } from './pages/appointments/AppointmentFormPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { PendingRecordsPage } from './pages/admin/PendingRecordsPage'
import { useAuthStore } from './store/auth'
import { authService } from './services/auth.service'

const SPLASH_KEY = 'edupal_splash_shown'

function App() {
  const { setAuth, logout } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem(SPLASH_KEY) === '1'
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setHydrated(true)
      return
    }

    // Restore from localStorage immediately — no flicker, no forced logout on cold start
    setHydrated(true)

    // Verify in the background and refresh user data
    authService
      .me()
      .then(({ user }) => setAuth(user, token))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : ''
        // Only logout on explicit auth rejection — not on network/server errors
        if (msg === 'Unauthorized' || msg === 'Invalid token') {
          logout()
        }
      })
  }, [setAuth, logout])

  function handleSplashComplete() {
    sessionStorage.setItem(SPLASH_KEY, '1')
    setSplashDone(true)
  }

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (!hydrated) return null

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Standalone protected — no AppShell */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* App shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/new" element={<StudentFormPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/students/:id/edit" element={<StudentFormPage />} />

          <Route path="/staff" element={<StaffPage />} />
          <Route path="/staff/new" element={<StaffFormPage />} />
          <Route path="/staff/:id" element={<StaffDetailPage />} />
          <Route path="/staff/:id/edit" element={<StaffFormPage />} />

          <Route path="/medical" element={<MedicalPage />} />
          <Route path="/medical/new" element={<MedicalFormPage />} />
          <Route path="/medical/:id" element={<MedicalDetailPage />} />
          <Route path="/medical/:id/edit" element={<MedicalFormPage />} />

          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/new" element={<AppointmentFormPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/pending-records" element={<PendingRecordsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
