import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getBookingDetails } from '../services/api.js'
import { formatCurrency, formatDateTime } from './pageUtils.js'
import brandMark from '../assets/clipart900500.png'

function normalizeStatus(value) {
  return String(value ?? '').trim().toLowerCase()
}

export default function BoardingPassPage() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [printed, setPrinted] = useState(false)

  const isConfirmed = normalizeStatus(booking?.status ?? booking?.Status) === 'confirmed'

  async function loadBooking() {
    setLoading(true)
    setError('')

    try {
      const response = await getBookingDetails(bookingId)
      setBooking(response?.data ?? null)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load the boarding pass.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  useEffect(() => {
    if (!booking || !isConfirmed || printed) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.print()
      setPrinted(true)
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [booking, isConfirmed, printed])

  function handlePrint() {
    window.print()
    setPrinted(true)
  }

  function handleBack() {
    navigate('/profile')
  }

  if (loading) {
    return (
      <section className="boarding-pass-page">
        <p className="page-note">Loading boarding pass...</p>
      </section>
    )
  }

  if (error || !booking) {
    return (
      <section className="boarding-pass-page">
        <div className="boarding-pass-shell">
          <p className="eyebrow">Boarding pass</p>
          <h2>Booking not found</h2>
          <p className="page-note">{error || 'We could not find this booking.'}</p>
          <div className="boarding-pass-actions">
            <button type="button" className="primary-button" onClick={handleBack}>
              Back to profile
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!isConfirmed) {
    return (
      <section className="boarding-pass-page">
        <div className="boarding-pass-shell">
          <p className="eyebrow">Boarding pass</p>
          <h2>Boarding pass available after payment</h2>
          <p className="page-note">
            This booking is currently {booking.status ?? booking.Status}. Please complete payment
            first.
          </p>
          <div className="boarding-pass-actions">
            <button type="button" className="primary-button" onClick={handleBack}>
              Back to profile
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="boarding-pass-page">
      <div className="boarding-pass-shell">
        <div className="boarding-pass-toolbar no-print">
          <button type="button" className="secondary-button" onClick={handlePrint}>
            Print / Save as PDF
          </button>
          <button type="button" className="ghost-button" onClick={handleBack}>
            Back to profile
          </button>
        </div>

        <article className="boarding-pass">
          <header className="boarding-pass__header">
            <div className="boarding-pass__brand">
              <img className="boarding-pass__logo" src={brandMark} alt="" aria-hidden="true" />
              <div>
                <p className="eyebrow">SimplyFly</p>
                <h1>Boarding Pass</h1>
              </div>
            </div>
            <div className="boarding-pass__status">
              <span>Confirmed</span>
            </div>
          </header>

          <div className="boarding-pass__hero">
            <div>
              <span>Passenger</span>
              <strong>
                {booking.passengerName ?? booking.PassengerName ?? user?.email ?? 'Guest'}
              </strong>
            </div>
            <div>
              <span>Booking #</span>
              <strong>{booking.id ?? booking.Id}</strong>
            </div>
          </div>

          <dl className="boarding-pass__grid">
            <div>
              <dt>Flight</dt>
              <dd>
                {booking.flightNumber ?? booking.FlightNumber}{' '}
                {booking.flightName ?? booking.FlightName
                  ? `| ${booking.flightName ?? booking.FlightName}`
                  : ''}
              </dd>
            </div>
            <div>
              <dt>Seat</dt>
              <dd>{booking.seatNumber ?? booking.SeatNumber}</dd>
            </div>
            <div>
              <dt>Flight ID</dt>
              <dd>{booking.flightId ?? booking.FlightId}</dd>
            </div>
            <div>
              <dt>Booked on</dt>
              <dd>{formatDateTime(booking.bookingDate ?? booking.BookingDate)}</dd>
            </div>
          </dl>

          <footer className="boarding-pass__footer">
            <div>
              <span>Status</span>
              <strong>{booking.status ?? booking.Status}</strong>
            </div>
            <div>
              <span>Boarding</span>
              <strong>Ready to print</strong>
            </div>
            <div>
              <span>Fare</span>
              <strong>{formatCurrency(booking.amount ?? booking.Amount ?? 0)}</strong>
            </div>
          </footer>
        </article>

        <div className="boarding-pass-actions no-print">
          <Link className="secondary-button" to="/profile">
            Return to profile
          </Link>
          <button type="button" className="primary-button" onClick={handlePrint}>
            Print / Save as PDF
          </button>
        </div>
      </div>
    </section>
  )
}
