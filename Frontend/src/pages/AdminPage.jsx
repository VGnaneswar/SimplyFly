import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminBookings, getAdminPayments, getAdminUsers } from '../services/api.js'
import { formatCurrency, formatDateTime, getArrayData } from './pageUtils.js'

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
    <section className="admin-page">
      <header className="admin-hero">
        <div className="section-heading admin-heading">
          <p className="eyebrow">Admin</p>
          <h2>Admin dashboard</h2>
          <p>Track users, bookings, and payments from one place.</p>
        </div>

        
      </header>

      {!isAuthenticated ? (
        <p className="page-note">Please sign in as an admin to view this dashboard.</p>
      ) : user?.role !== 'Admin' ? (
        <p className="page-note">This dashboard is available to admins only.</p>
      ) : null}

      {loading && isAuthenticated && user?.role === 'Admin' ? (
        <p className="page-note">Loading admin data...</p>
      ) : null}
      {error ? <p className="form-message error">{error}</p> : null}

      <div className="stats-grid">
        <article className="stat-card stat-card--blue">
          <span>Total users</span>
          <strong>{users.length}</strong>
          <p>Registered accounts in the system.</p>
        </article>
        <article className="stat-card stat-card--indigo">
          <span>Total bookings</span>
          <strong>{bookings.length}</strong>
          <p>All booking records created so far.</p>
        </article>
        <article className="stat-card stat-card--teal">
          <span>Total payments</span>
          <strong>{payments.length}</strong>
          <p>Payments processed or pending in the app.</p>
        </article>
      </div>

      <div className="admin-panels">
        <article className="admin-card">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">Users</p>
            <h3>All users</h3>
          </div>
          <div className="admin-list admin-list--scroll">
            {users.length > 0 ? (
              users.map((currentUser) => (
                <div className="admin-list-item" key={currentUser.id ?? currentUser.Id}>
                  <div>
                    <strong>{currentUser.fullName ?? currentUser.FullName ?? 'User'}</strong>
                    <span>{currentUser.email ?? currentUser.Email ?? 'No email'}</span>
                  </div>
                  <span className="admin-chip">
                    {currentUser.role ?? currentUser.Role ?? 'Passenger'}
                  </span>
                </div>
              ))
            ) : (
              <p className="page-note">No users available yet.</p>
            )}
          </div>
        </article>

        <article className="admin-card">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">Bookings</p>
            <h3>All bookings</h3>
          </div>
          <div className="admin-list admin-list--scroll">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div className="admin-list-item" key={booking.id ?? booking.Id}>
                  <div>
                    <strong>
                      Booking #{booking.id ?? booking.Id} · Seat{' '}
                      {booking.seatNumber ?? booking.SeatNumber}
                    </strong>
                    <span>
                      {booking.flightNumber ?? booking.FlightNumber ?? 'Flight'} ·{' '}
                      {formatDateTime(booking.bookingDate ?? booking.BookingDate)}
                    </span>
                  </div>
                  <span className="admin-chip">
                    {booking.status ?? booking.Status ?? 'Pending'}
                  </span>
                </div>
              ))
            ) : (
              <p className="page-note">No bookings available yet.</p>
            )}
          </div>
        </article>

        <article className="admin-card">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">Payments</p>
            <h3>All payments</h3>
          </div>
          <div className="admin-list admin-list--scroll">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div className="admin-list-item" key={payment.id ?? payment.Id}>
                  <div>
                    <strong>
                      Payment #{payment.id ?? payment.Id} ·{' '}
                      {formatCurrency(payment.amount ?? payment.Amount)}
                    </strong>
                    <span>
                      Booking #{payment.bookingId ?? payment.BookingId} ·{' '}
                      {formatDateTime(payment.paymentDate ?? payment.PaymentDate)}
                    </span>
                  </div>
                  <span className="admin-chip">
                    {payment.status ?? payment.Status ?? 'Pending'}
                  </span>
                </div>
              ))
            ) : (
              <p className="page-note">No payments available yet.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
