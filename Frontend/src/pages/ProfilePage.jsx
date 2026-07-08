import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { cancelBooking, getBookingHistory } from '../services/api.js'
import { formatDateTime, getArrayData } from './pageUtils.js'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const showBookingHistory = user?.role === 'Passenger'
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [nowTick, setNowTick] = useState(Date.now())

  const historyList = history ?? []

  async function loadHistory() {
    if (!showBookingHistory) {
      setHistory([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await getBookingHistory()
      setHistory(getArrayData(response))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load booking history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [showBookingHistory])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  async function handleCancelBooking(id) {
    setSubmitLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await cancelBooking(id)
      setMessage(response?.message || 'Booking cancelled successfully.')
      await loadHistory()
    } catch (requestError) {
      setError(requestError.message || 'Unable to cancel booking.')
    } finally {
      setSubmitLoading(false)
    }
  }

  function handleLogout() {
    signOut()
    navigate('/auth')
  }

  function handleDownloadBoardingPass(id) {
    const boardingPassUrl = `${window.location.origin}/boarding-pass/${id}`
    window.open(boardingPassUrl, '_blank', 'noopener,noreferrer')
  }

  function handlePayNow(id) {
    navigate(`/bookings?bookingId=${id}`)
  }

  function isBookingExpired(booking) {
    const status = String(booking.status ?? booking.Status ?? '').trim().toLowerCase()
    const deadline = booking.paymentDeadline ?? booking.PaymentDeadline

    if (status !== 'pendingpayment' || !deadline) {
      return false
    }

    return new Date(deadline).getTime() <= Date.now()
  }

  function getTimeRemaining(booking) {
    const deadline = booking.paymentDeadline ?? booking.PaymentDeadline
    if (!deadline) {
      return ''
    }

    const remaining = new Date(deadline).getTime() - nowTick
    if (remaining <= 0) {
      return 'Expired'
    }

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return (
    <section className="profile-page">
      <section className="profile-hero">
        <div className="section-heading profile-heading">
          <p className="eyebrow">Profile</p>
          <h2>Your account and booking history</h2>
          <p>Review your bookings, manage cancellations, and sign out from one place.</p>
        </div>

        <div className="profile-summary">
          <div>
            <span>Email</span>
            <strong>{user?.email || 'No email available'}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{user?.role || 'Passenger'}</strong>
          </div>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {showBookingHistory ? (
        <>
          {message ? <p className="form-message success">{message}</p> : null}
          {error ? <p className="form-message error">{error}</p> : null}
          {loading ? <p className="page-note">Loading booking history...</p> : null}

          <section className="booking-history-section">
            <div className="section-heading">
              <p className="eyebrow">My bookings</p>
              <h3>History and actions</h3>
            </div>

            {!loading && historyList.length === 0 ? (
              <div className="profile-empty">
                <p className="page-note">You do not have any bookings yet.</p>
                <button type="button" className="primary-button" onClick={() => navigate('/flights')}>
                  Browse flights
                </button>
              </div>
            ) : null}

            <div className="booking-history">
              {historyList.map((booking) => {
                const isCancelled =
                  String(booking.status ?? booking.Status ?? '').trim().toLowerCase() ===
                  'cancelled'
                const expired = isBookingExpired(booking)

                return (
                  <article className="history-card" key={booking.id ?? booking.Id}>
                    <div className="flight-card__top">
                      <div>
                        <p className="flight-number">Booking #{booking.id ?? booking.Id}</p>
                        <h3>
                          Flight {booking.flightNumber ?? booking.FlightNumber} | Seat{' '}
                          {booking.seatNumber ?? booking.SeatNumber}
                        </h3>
                      </div>
                      <strong className="fare">{booking.status ?? booking.Status}</strong>
                    </div>

                    <dl className="flight-meta">
                      <div>
                        <dt>Passenger</dt>
                        <dd>{booking.passengerName ?? booking.PassengerName ?? 'You'}</dd>
                      </div>
                      <div>
                        <dt>Booked on</dt>
                        <dd>{formatDateTime(booking.bookingDate ?? booking.BookingDate)}</dd>
                      </div>
                      <div>
                        <dt>Pay by</dt>
                        <dd>{formatDateTime(booking.paymentDeadline ?? booking.PaymentDeadline)}</dd>
                      </div>
                      <div>
                        <dt>Flight ID</dt>
                        <dd>{booking.flightId ?? booking.FlightId}</dd>
                      </div>
                    </dl>

                    <div className="history-actions">
                      {String(booking.status ?? booking.Status ?? '').trim().toLowerCase() ===
                      'confirmed' ? (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleDownloadBoardingPass(booking.id ?? booking.Id)}
                        >
                          Download boarding pass
                        </button>
                      ) : null}
                      {String(booking.status ?? booking.Status ?? '').trim().toLowerCase() ===
                      'pendingpayment' ? (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handlePayNow(booking.id ?? booking.Id)}
                          disabled={expired}
                        >
                          {expired ? 'Payment expired' : `Pay now${getTimeRemaining(booking) ? ` · ${getTimeRemaining(booking)}` : ''}`}
                        </button>
                      ) : null}
                      {!isCancelled && !expired ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleCancelBooking(booking.id ?? booking.Id)}
                          disabled={submitLoading}
                        >
                          Cancel
                        </button>
                      ) : expired ? (
                        <span className="page-note">Payment window expired</span>
                      ) : (
                        <span className="page-note">Cancelled</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}
