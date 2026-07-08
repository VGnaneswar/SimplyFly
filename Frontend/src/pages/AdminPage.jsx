import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminBookings, getAdminPayments, getAdminUsers } from '../services/api.js'
import { getArrayData } from './pageUtils.js'

export default function AdminPage() {
  const { isAuthenticated, user } = useAuth()
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      setLoading(false)
      setUsers([])
      setBookings([])
      setPayments([])
      return
    }

    async function loadAdminData() {
      setLoading(true)
      setError('')

      try {
        const [usersResponse, bookingsResponse, paymentsResponse] = await Promise.all([
          getAdminUsers(),
          getAdminBookings(),
          getAdminPayments(),
        ])
        setUsers(getArrayData(usersResponse))
        setBookings(getArrayData(bookingsResponse))
        setPayments(getArrayData(paymentsResponse))
      } catch (requestError) {
        setError(requestError.message || 'Unable to load admin data.')
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [isAuthenticated, user?.role])

  return (
    <section className="panel admin-panel">
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h2>Admin dashboard page</h2>
        <p>This view pulls users, bookings, and payments from the admin endpoints.</p>
      </div>

      {!isAuthenticated ? (
        <p className="page-note">Please sign in as an admin to view this dashboard.</p>
      ) : user?.role !== 'Admin' ? (
        <p className="page-note">This dashboard is available to admins only.</p>
      ) : null}

      {loading && isAuthenticated && user?.role === 'Admin' ? (
        <p className="page-note">Loading admin data…</p>
      ) : null}
      {error ? <p className="form-message error">{error}</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Users</span>
          <strong>{users.length}</strong>
        </article>
        <article className="stat-card">
          <span>Bookings</span>
          <strong>{bookings.length}</strong>
        </article>
        <article className="stat-card">
          <span>Payments</span>
          <strong>{payments.length}</strong>
        </article>
      </div>
    </section>
  )
}