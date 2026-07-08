import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { addFlight, getFlightBookings, getFlights, updateFlight } from '../services/api.js'
import { formatDateTime, getArrayData, getFlightList } from './pageUtils.js'

const emptyForm = {
  flightNumber: '',
  flightName: '',
  origin: '',
  destination: '',
  departureTime: '',
  arrivalTime: '',
  fare: '',
  totalSeats: '',
}

export default function ManageFlightsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [flights, setFlights] = useState([])
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [selectedBookings, setSelectedBookings] = useState([])
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState(emptyForm)

  async function loadFlights() {
    setLoading(true)
    setError('')

    try {
      const response = await getFlights({ pageNumber: 1, pageSize: 50 })
      setFlights(getFlightList(response))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load flights.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlights()
  }, [])

  function resetForm() {
    setEditId('')
    setForm(emptyForm)
  }

  function fillForEdit(flight) {
    setEditId(flight.id ?? flight.Id ?? '')
    setForm({
      flightNumber: flight.flightNumber ?? flight.FlightNumber ?? '',
      flightName: flight.flightName ?? flight.FlightName ?? '',
      origin: flight.origin ?? flight.Origin ?? '',
      destination: flight.destination ?? flight.Destination ?? '',
      departureTime: (flight.departureTime ?? flight.DepartureTime ?? '').slice?.(0, 16) ?? '',
      arrivalTime: (flight.arrivalTime ?? flight.ArrivalTime ?? '').slice?.(0, 16) ?? '',
      fare: flight.fare ?? flight.Fare ?? '',
      totalSeats: flight.totalSeats ?? flight.TotalSeats ?? '',
    })
    setMessage('')
    setError('')
  }

  async function viewBookings(flight) {
    const flightId = flight.id ?? flight.Id
    if (!flightId) {
      return
    }

    setBookingsLoading(true)
    setSelectedFlight(flight)
    setError('')
    setMessage('')

    try {
      const response = await getFlightBookings(flightId)
      setSelectedBookings(getArrayData(response))
    } catch (requestError) {
      setSelectedBookings([])
      setError(requestError.message || 'Unable to load flight bookings.')
    } finally {
      setBookingsLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      flightNumber: form.flightNumber,
      flightName: form.flightName,
      origin: form.origin,
      destination: form.destination,
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
      fare: Number(form.fare),
      totalSeats: Number(form.totalSeats),
    }

    try {
      if (editId) {
        await updateFlight(editId, payload)
        setMessage('Flight updated successfully.')
      } else {
        await addFlight(payload)
        setMessage('Flight added successfully.')
      }

      resetForm()
      await loadFlights()
    } catch (requestError) {
      setError(requestError.message || 'Unable to save flight.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="manage-page">
      <section className="manage-hero">
        <div className="section-heading manage-heading">
          <p className="eyebrow">Manage Flights</p>
          <h2>Admin and flight owner tools</h2>
          <p>
            Post new upcoming flights
          </p>
        </div>

        <div className="manage-role-chip">
          Signed in as <strong>{user?.role || 'Unknown'}</strong>
        </div>
      </section>

      {message ? <p className="form-message success">{message}</p> : null}
      {error ? <p className="form-message error">{error}</p> : null}
      {loading ? <p className="page-note">Loading flights...</p> : null}

      <section className="manage-card">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">{editId ? `Editing flight #${editId}` : 'New flight'}</p>
          <h3>{editId ? 'Update flight details' : 'Add a new flight'}</h3>
        </div>

        <form className="manage-flight-form" onSubmit={handleSubmit}>
          <div className="manage-grid">
            <label>
              <span>Flight number</span>
              <input
                type="text"
                required
                value={form.flightNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, flightNumber: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Flight name</span>
              <input
                type="text"
                required
                value={form.flightName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, flightName: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Origin</span>
              <input
                type="text"
                required
                value={form.origin}
                onChange={(event) =>
                  setForm((current) => ({ ...current, origin: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Destination</span>
              <input
                type="text"
                required
                value={form.destination}
                onChange={(event) =>
                  setForm((current) => ({ ...current, destination: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Departure time</span>
              <input
                type="datetime-local"
                required
                value={form.departureTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, departureTime: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Arrival time</span>
              <input
                type="datetime-local"
                required
                value={form.arrivalTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, arrivalTime: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Fare</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.fare}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fare: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Total seats</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.totalSeats}
                onChange={(event) =>
                  setForm((current) => ({ ...current, totalSeats: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="manage-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update flight' : 'Add flight'}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="manage-card">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Current flights</p>
          <h3>Tap a flight to edit it or see its bookings</h3>
        </div>

        <div className="flight-grid flight-grid--manage">
          {flights.map((flight) => (
            <article className="flight-card flight-card--manage" key={flight.id ?? flight.Id}>
              <div className="flight-card__top">
                <div>
                  <p className="flight-number">{flight.flightNumber ?? flight.FlightNumber}</p>
                  <h3>{flight.flightName ?? flight.FlightName}</h3>
                </div>
              </div>
              <p className="route">
                {(flight.origin ?? flight.Origin) || '—'} →{' '}
                {(flight.destination ?? flight.Destination) || '—'}
              </p>
              <dl className="flight-meta">
                <div>
                  <dt>Owner</dt>
                  <dd>{flight.flightOwnerId ?? flight.FlightOwnerId ?? '—'}</dd>
                </div>
                <div>
                  <dt>Seats</dt>
                  <dd>
                    {flight.availableSeats ?? flight.AvailableSeats} /{' '}
                    {flight.totalSeats ?? flight.TotalSeats}
                  </dd>
                </div>
              </dl>
              <div className="manage-card-actions">
                <button type="button" className="ghost-button" onClick={() => fillForEdit(flight)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => viewBookings(flight)}
                >
                  View bookings
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="manage-card">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Flight bookings</p>
          <h3>
            {selectedFlight
              ? `Bookings for ${selectedFlight.flightNumber ?? selectedFlight.FlightNumber}`
              : 'Select a flight to see bookings'}
          </h3>
        </div>

        {bookingsLoading ? <p className="page-note">Loading bookings...</p> : null}

        <div className="booking-history">
          {!bookingsLoading && selectedFlight && selectedBookings.length === 0 ? (
            <p className="page-note">No bookings found for this flight yet.</p>
          ) : null}

          {selectedBookings.map((booking) => (
            <article className="history-card" key={booking.id ?? booking.Id}>
              <div className="flight-card__top">
                <div>
                  <p className="flight-number">Booking #{booking.id ?? booking.Id}</p>
                  <h3>
                    {booking.passengerName ?? booking.PassengerName ?? 'Passenger'} | Seat{' '}
                    {booking.seatNumber ?? booking.SeatNumber}
                  </h3>
                </div>
                <strong className="fare">{booking.status ?? booking.Status}</strong>
              </div>

              <dl className="flight-meta">
                <div>
                  <dt>Flight</dt>
                  <dd>{booking.flightNumber ?? booking.FlightNumber}</dd>
                </div>
                <div>
                  <dt>Booking date</dt>
                  <dd>{formatDateTime(booking.bookingDate ?? booking.BookingDate)}</dd>
                </div>
                <div>
                  <dt>Passenger ID</dt>
                  <dd>{booking.userId ?? booking.UserId}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
