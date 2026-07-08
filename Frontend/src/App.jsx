import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import ProtectedRoute from './layouts/ProtectedRoute.jsx'
import './App.css'

const OverviewPage = lazy(() => import('./pages/OverviewPage.jsx'))
const FlightsPage = lazy(() => import('./pages/FlightsPage.jsx'))
const ManageFlightsPage = lazy(() => import('./pages/ManageFlightsPage.jsx'))
const BookingsPage = lazy(() => import('./pages/BookingsPage.jsx'))
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))
const BoardingPassPage = lazy(() => import('./pages/BoardingPassPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <section className="panel page-panel">
          <p className="page-note">Loading page...</p>
        </section>
      }
    >
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/flights" element={<FlightsPage />} />
        <Route
          path="/manage-flights"
          element={
            <ProtectedRoute roles={['Admin', 'FlightOwner']}>
              <ManageFlightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={['Passenger']}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['Admin']} fallbackPath="/auth">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boarding-pass/:bookingId"
          element={
            <ProtectedRoute roles={['Passenger']}>
              <BoardingPassPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  const location = useLocation()
  const isBoardingPassRoute = location.pathname.startsWith('/boarding-pass/')

  if (isBoardingPassRoute) {
    return <AppRoutes />
  }

  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  )
}

export default App
