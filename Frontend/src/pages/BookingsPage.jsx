import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  bookFlight,
  getBookingDetails,
  getFlightSeatMap,
  getFlights,
  makePayment,
} from '../services/api.js'
import { formatCurrency, getFlightList } from './pageUtils.js'

const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F']

function normalizeSeatValue(value) {
  return String(value ?? '').trim().toUpperCase()
}

function buildSeatRows(totalSeats) {
  const seatCount = Number(totalSeats ?? 0)

  if (seatCount <= 0) {
    return []
  }

  const rows = []
  const rowCount = Math.ceil(seatCount / SEAT_COLUMNS.length)

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const rowNumber = rowIndex + 1
    const seats = SEAT_COLUMNS.map((column, columnIndex) => {
      const seatNumber = `${rowNumber}${column}`
      const seatIndex = rowIndex * SEAT_COLUMNS.length + columnIndex + 1

      if (seatIndex > seatCount) {
        return null
      }

      return seatNumber
    }).filter(Boolean)

    rows.push({ rowNumber, seats })
  }

  return rows
}

function getBookingIds(payload = {}) {
  return payload.BookingIds ?? payload.bookingIds ?? []
}

function getPaymentIds(payload = {}) {
  return payload.PaymentIds ?? payload.paymentIds ?? []
}

function getTotalAmount(payload = {}) {
  return Number(payload.TotalAmount ?? payload.totalAmount ?? 0)
}

export default function BookingsPage() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const [flightOptions, setFlightOptions] = useState([])
  const [lastBooking, setLastBooking] = useState(null)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [seatMap, setSeatMap] = useState({
    flightId: null,
    flightNumber: '',
    flightName: '',
    totalSeats: 0,
    availableSeats: 0,
    bookedSeats: [],
  })
  const [bookingForm, setBookingForm] = useState({
    flightId: searchParams.get('flightId') ?? '',
  })
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'Card',
    cardHolderName: '',
    cardNumber: '',
    upiId: '',
  })
  const [loading, setLoading] = useState(true)
  const [seatLoading, setSeatLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [seatError, setSeatError] = useState('')
  const [paymentErrors, setPaymentErrors] = useState({
    paymentMethod: '',
    cardHolderName: '',
    cardNumber: '',
    upiId: '',
  })
  const [selectedSeats, setSelectedSeats] = useState([])
  const [seatMapVisible, setSeatMapVisible] = useState(false)

  const selectedFlightId = Number(bookingForm.flightId)
  const selectedFlight = flightOptions.find((flight) => Number(flight.id ?? flight.Id) === selectedFlightId)
  const bookedSeatSet = useMemo(
    () => new Set(seatMap.bookedSeats.map(normalizeSeatValue)),
    [seatMap.bookedSeats],
  )
  const selectedSeatSet = useMemo(
    () => new Set(selectedSeats.map(normalizeSeatValue)),
    [selectedSeats],
  )
  const seatRows = useMemo(() => buildSeatRows(seatMap.totalSeats), [seatMap.totalSeats])
  const pendingBookingIds = pendingPayment?.bookingIds ?? []
  const pendingPaymentIds = pendingPayment?.paymentIds ?? []
  const pendingTotalAmount = Number(pendingPayment?.totalAmount ?? 0)
  const paymentDeadline = pendingPayment?.paymentDeadline ?? null
  const [timeRemaining, setTimeRemaining] = useState('')
  const paymentWindowExpired =
    paymentDeadline != null && new Date(paymentDeadline).getTime() <= Date.now()

  async function loadBookingData() {
    setLoading(true)
    setError('')

    try {
      const flightsResponse = await getFlights({ pageNumber: 1, pageSize: 200, sortBy: 'departure' })

      setFlightOptions(getFlightList(flightsResponse))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load booking data.')
    } finally {
      setLoading(false)
    }
  }

  async function loadSeatMap(flightId, forceLoad = false) {
    if (!flightId) {
      setSeatMap({
        flightId: null,
        flightNumber: '',
        flightName: '',
        totalSeats: 0,
        availableSeats: 0,
        bookedSeats: [],
      })
      setSelectedSeats([])
      setSeatError('')
      return
    }

    if (!seatMapVisible && !forceLoad) {
      return
    }

    setSeatLoading(true)
    setSeatError('')

    try {
      const response = await getFlightSeatMap(flightId)
      const data = response?.data ?? {}

      setSeatMap({
        flightId: data.FlightId ?? data.flightId ?? flightId,
        flightNumber: data.FlightNumber ?? data.flightNumber ?? '',
        flightName: data.FlightName ?? data.flightName ?? '',
        totalSeats: data.TotalSeats ?? data.totalSeats ?? 0,
        availableSeats: data.AvailableSeats ?? data.availableSeats ?? 0,
        bookedSeats: data.BookedSeats ?? data.bookedSeats ?? [],
      })
      setSelectedSeats([])
    } catch (requestError) {
      setSeatError(requestError.message || 'Unable to load seat map.')
      setSeatMap({
        flightId,
        flightNumber: '',
        flightName: '',
        totalSeats: 0,
        availableSeats: 0,
        bookedSeats: [],
      })
      setSelectedSeats([])
    } finally {
      setSeatLoading(false)
    }
  }

  useEffect(() => {
    loadBookingData()
  }, [isAuthenticated])

  useEffect(() => {
    const flightIdFromUrl = searchParams.get('flightId') ?? ''

    if (flightIdFromUrl) {
      setBookingForm((current) =>
        current.flightId === flightIdFromUrl
          ? current
          : {
              ...current,
              flightId: flightIdFromUrl,
            },
      )
    }
  }, [searchParams])

  useEffect(() => {
    const bookingIdFromUrl = searchParams.get('bookingId') ?? ''

    if (!bookingIdFromUrl) {
      return
    }

    let isMounted = true

    async function loadPendingBooking() {
      setLoading(true)
      setError('')

      try {
        const response = await getBookingDetails(Number(bookingIdFromUrl))
        const data = response?.data ?? {}
        const bookingId = data.Id ?? data.id ?? Number(bookingIdFromUrl)
        const flightId = data.FlightId ?? data.flightId ?? ''
        const amount = Number(data.Amount ?? data.amount ?? 0)
        const deadline = data.PaymentDeadline ?? data.paymentDeadline ?? null

        if (!isMounted) {
          return
        }

        setBookingForm((current) => ({
          ...current,
          flightId: flightId ? String(flightId) : current.flightId,
        }))
        setLastBooking(data)
        setPendingPayment({
          bookingIds: [bookingId],
          paymentIds: [],
          totalAmount: amount,
          seatNumbers: [data.SeatNumber ?? data.seatNumber].filter(Boolean),
          paymentDeadline: deadline,
        })
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || 'Unable to load booking checkout.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPendingBooking()

    return () => {
      isMounted = false
    }
  }, [searchParams])

  useEffect(() => {
    if (seatMapVisible) {
      loadSeatMap(selectedFlightId)
    }
  }, [selectedFlightId, seatMapVisible])

  function toggleSeat(seatNumber) {
    const normalizedSeat = normalizeSeatValue(seatNumber)

    if (!normalizedSeat || bookedSeatSet.has(normalizedSeat)) {
      return
    }

    setSelectedSeats((current) =>
      current.includes(normalizedSeat)
        ? current.filter((seat) => seat !== normalizedSeat)
        : [...current, normalizedSeat],
    )
  }

  function resetPaymentForm(method = 'Card') {
    setPaymentForm({
      paymentMethod: method,
      cardHolderName: '',
      cardNumber: '',
      upiId: '',
    })
    setPaymentErrors({
      paymentMethod: '',
      cardHolderName: '',
      cardNumber: '',
      upiId: '',
    })
  }

  function validatePaymentForm() {
    const nextErrors = {
      paymentMethod: '',
      cardHolderName: '',
      cardNumber: '',
      upiId: '',
    }
    const paymentMethod = paymentForm.paymentMethod.trim()

    if (paymentMethod === 'Card') {
      const cardHolderName = paymentForm.cardHolderName.trim()
      const cardNumber = paymentForm.cardNumber.trim()

      if (!cardHolderName) {
        nextErrors.cardHolderName = 'Enter the card holder name.'
      }

      if (cardNumber.length < 12 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
        nextErrors.cardNumber = 'Card number must be 12-19 digits.'
      }
    }

    if (paymentMethod === 'UPI') {
      const upiId = paymentForm.upiId.trim()

      if (!/^[A-Za-z0-9._-]+@[A-Za-z]+$/.test(upiId)) {
        nextErrors.upiId = 'Enter a valid UPI ID like name@bank.'
      }
    }

    if (paymentMethod !== 'Card' && paymentMethod !== 'UPI') {
      nextErrors.paymentMethod = 'Choose Card or UPI before paying.'
    }

    return nextErrors
  }

  async function handleSelectSeatsClick() {
    if (!bookingForm.flightId) {
      setError('Choose a flight first, then select seats.')
      return
    }

    setSeatMapVisible(true)
    await loadSeatMap(Number(bookingForm.flightId), true)
  }

  async function handleBookingSubmit(event) {
    event.preventDefault()
    setBookingLoading(true)
    setError('')
    setMessage('')

    if (selectedSeats.length === 0) {
      setError('Please select at least one seat.')
      setBookingLoading(false)
      return
    }

    try {
      const response = await bookFlight({
        flightId: Number(bookingForm.flightId),
        SeatNumber: selectedSeats[0],
        SeatNumbers: selectedSeats,
      })
      const bookingResult = response?.data ?? {}
      const bookingIds = getBookingIds(bookingResult)
      const paymentIds = getPaymentIds(bookingResult)
      const totalAmount = getTotalAmount(bookingResult)
      const seatNumbers = bookingResult.SeatNumbers ?? bookingResult.seatNumbers ?? selectedSeats

      setLastBooking(bookingResult)
      setPendingPayment({
        bookingIds,
        paymentIds,
        totalAmount,
        seatNumbers,
        paymentDeadline: bookingResult.PaymentDeadline ?? bookingResult.paymentDeadline ?? null,
      })
      resetPaymentForm()
      setMessage(
        response?.message ||
          `Booking created for ${seatNumbers.length} seat(s). Total payable is ${formatCurrency(totalAmount)}.`,
      )
      setSelectedSeats([])
      await loadBookingData()
      await loadSeatMap(Number(bookingForm.flightId), true)
    } catch (requestError) {
      setError(requestError.message || 'Unable to create booking.')
    } finally {
      setBookingLoading(false)
    }
  }

  useEffect(() => {
    if (!paymentDeadline) {
      setTimeRemaining('')
      return undefined
    }

    const updateTimer = () => {
      const remaining = new Date(paymentDeadline).getTime() - Date.now()

      if (remaining <= 0) {
        setTimeRemaining('Expired')
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateTimer()
    const intervalId = window.setInterval(updateTimer, 1000)

    return () => window.clearInterval(intervalId)
  }, [paymentDeadline])

  async function handlePaymentSubmit(event) {
    event.preventDefault()
    setPaymentLoading(true)
    setError('')
    setMessage('')

    if (pendingBookingIds.length === 0) {
      setError('Please create a booking before paying.')
      setPaymentLoading(false)
      return
    }

    if (paymentWindowExpired) {
      setError('Your 10-minute payment window expired. Please book again.')
      setPaymentLoading(false)
      return
    }

    const validationErrors = validatePaymentForm()
    const hasValidationErrors = Object.values(validationErrors).some(Boolean)

    if (hasValidationErrors) {
      setPaymentErrors(validationErrors)
      setError('Please fix the highlighted payment details.')
      setPaymentLoading(false)
      return
    }

    setPaymentErrors({
      paymentMethod: '',
      cardHolderName: '',
      cardNumber: '',
      upiId: '',
    })

    const paymentMethod = paymentForm.paymentMethod.trim()

    const payload = {
      bookingIds: pendingBookingIds,
      bookingId: pendingBookingIds[0],
      paymentMethod,
    }

    if (paymentMethod === 'Card') {
      payload.cardHolderName = paymentForm.cardHolderName
      payload.cardNumber = paymentForm.cardNumber
    } else if (paymentMethod === 'UPI') {
      payload.upiId = paymentForm.upiId
    }

    try {
      const response = await makePayment(payload)
      const paymentResult = response?.data ?? {}
      const paidAmount = getTotalAmount(paymentResult) || pendingTotalAmount

      setMessage(
        response?.message ||
          `Payment processed successfully for ${formatCurrency(paidAmount)}.`,
      )
      setPendingPayment(null)
      resetPaymentForm(paymentMethod)
      setLastBooking((current) => ({
        ...(current ?? {}),
        PaymentStatus: paymentResult.PaymentStatus ?? paymentResult.paymentStatus ?? 'Paid',
      }))
      await loadBookingData()
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete payment.')
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <section className="booking-page">
      <section className="booking-hero">
        <div className="section-heading booking-page__intro">
          <p className="eyebrow">Bookings + Payments</p>
          <h2>Book seats, pay quickly, and manage your trip history</h2>
          <p>
            Pick a flight, choose your seats, complete payment, and keep track of every booking in
            one place.
          </p>
        </div>

        {lastBooking ? (
          <div className="booking-highlight">
            <strong>Latest booking</strong>
            <span>
              Booking ID {getBookingIds(lastBooking).join(', ') || '-'} | Payment ID{' '}
              {getPaymentIds(lastBooking).join(', ') || '-'} | Total{' '}
              {formatCurrency(getTotalAmount(lastBooking))}
            </span>
            <p>Complete payment below to confirm your seat(s) instantly.</p>
          </div>
        ) : null}

        {!isAuthenticated ? (
          <p className="page-note booking-auth-note">
            Please sign in to create bookings, make payments, and review booking history.
          </p>
        ) : null}

        {message ? <p className="form-message success">{message}</p> : null}
        {error ? <p className="form-message error">{error}</p> : null}
        {loading && isAuthenticated ? <p className="page-note">Loading booking data...</p> : null}
      </section>

      <div className="booking-layout">
        <form className="booking-form booking-card" onSubmit={handleBookingSubmit}>
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">Create booking</p>
            <h3>Choose a flight and reserve seats</h3>
          </div>

          <label>
            <span>Flight</span>
            <select
              required
              disabled={!isAuthenticated}
              value={bookingForm.flightId}
              onChange={(event) =>
                setBookingForm((current) => ({
                  ...current,
                  flightId: event.target.value,
                }))
              }
            >
              <option value="">Select a flight</option>
              {flightOptions.map((flight) => (
                <option key={flight.id ?? flight.Id} value={flight.id ?? flight.Id}>
                  {(flight.flightNumber ?? flight.FlightNumber) || 'Flight'} |{' '}
                  {(flight.origin ?? flight.Origin) || 'Origin'} to{' '}
                  {(flight.destination ?? flight.Destination) || 'Destination'}
                </option>
              ))}
            </select>
          </label>

          <div className="selected-seat-summary">
            <span>Selected seats</span>
            <strong>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'No seats selected yet'}</strong>
          </div>

          <div className="booking-form__actions">
            <button
              type="button"
              className="secondary-button"
              disabled={!isAuthenticated || !bookingForm.flightId}
              onClick={handleSelectSeatsClick}
            >
              Select seats
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={bookingLoading || !isAuthenticated || selectedSeats.length === 0}
            >
              {bookingLoading ? 'Saving...' : 'Book flight'}
            </button>
          </div>

          {pendingBookingIds.length > 0 ? (
            <div className="booking-highlight booking-highlight--inline">
              <strong>Checkout ready</strong>
              <span>
                Booking IDs {pendingBookingIds.join(', ')} | Payment IDs{' '}
                {pendingPaymentIds.join(', ') || '-'} | Total {formatCurrency(pendingTotalAmount)}
              </span>
              <p>
                Enter your payment details below, then press Pay now. Time left to pay:{' '}
                {timeRemaining || '10:00'}.
              </p>
            </div>
          ) : null}
        </form>

        <section className="seat-map-panel booking-card">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">Seat map</p>
            <h3>
              {selectedFlight
                ? `${selectedFlight.flightNumber ?? selectedFlight.FlightNumber} | ${selectedFlight.flightName ?? selectedFlight.FlightName}`
                : seatMap.flightNumber || seatMap.flightName || 'Select a flight to open the cabin'}
            </h3>
          </div>

          <div className="seat-map-stats">
            <article>
              <span>Total seats</span>
              <strong>{seatMap.totalSeats}</strong>
            </article>
            <article>
              <span>Available</span>
              <strong>{seatMap.availableSeats}</strong>
            </article>
            <article>
              <span>Selected</span>
              <strong>{selectedSeats.length}</strong>
            </article>
          </div>

          {seatLoading ? <p className="page-note">Loading seat map...</p> : null}
          {seatError ? <p className="form-message error">{seatError}</p> : null}

          {seatMapVisible ? (
            <>
              <div className="seat-legend">
                <span>
                  <i className="seat-swatch available" /> Available
                </span>
                <span>
                  <i className="seat-swatch selected" /> Selected
                </span>
                <span>
                  <i className="seat-swatch occupied" /> Occupied
                </span>
              </div>

              <div className="seat-cabin" aria-label="Select one or more seats">
                <div className="seat-cabin__head">
                  <span>Front</span>
                  <strong>Cabin</strong>
                </div>

                {seatRows.length > 0 ? (
                  seatRows.map((row) => (
                    <div className="seat-row" key={row.rowNumber}>
                      <span className="seat-row__label">{row.rowNumber}</span>
                      {row.seats.slice(0, 3).map((seatNumber) => {
                        const normalizedSeat = normalizeSeatValue(seatNumber)
                        const isOccupied = bookedSeatSet.has(normalizedSeat)
                        const isSelected = selectedSeatSet.has(normalizedSeat)

                        return (
                          <button
                            key={seatNumber}
                            type="button"
                            className={
                              isOccupied
                                ? 'seat-button occupied'
                                : isSelected
                                  ? 'seat-button selected'
                                  : 'seat-button available'
                            }
                            onClick={() => toggleSeat(seatNumber)}
                            disabled={!isAuthenticated || isOccupied}
                          >
                            {seatNumber}
                          </button>
                        )
                      })}
                      <span className="seat-row__aisle" aria-hidden="true" />
                      {row.seats.slice(3).map((seatNumber) => {
                        const normalizedSeat = normalizeSeatValue(seatNumber)
                        const isOccupied = bookedSeatSet.has(normalizedSeat)
                        const isSelected = selectedSeatSet.has(normalizedSeat)

                        return (
                          <button
                            key={seatNumber}
                            type="button"
                            className={
                              isOccupied
                                ? 'seat-button occupied'
                                : isSelected
                                  ? 'seat-button selected'
                                  : 'seat-button available'
                            }
                            onClick={() => toggleSeat(seatNumber)}
                            disabled={!isAuthenticated || isOccupied}
                          >
                            {seatNumber}
                          </button>
                        )
                      })}
                    </div>
                  ))
                ) : (
                  <p className="page-note">
                    {selectedFlightId
                      ? 'Seat map is not available for this flight yet.'
                      : 'Choose a flight and click Select seats to load the cabin.'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="page-note">
              Choose a flight first, then click <strong>Select seats</strong> to open the cabin
              map.
            </p>
          )}
        </section>

        <form className="payment-card booking-card" noValidate onSubmit={handlePaymentSubmit}>
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">Payment</p>
            <h3>Enter payment details and pay now</h3>
          </div>

          <div className="selected-seat-summary">
            <span>Amount due</span>
            <strong>{formatCurrency(pendingTotalAmount)}</strong>
          </div>

          <label>
            <span>Payment method</span>
            <select
              required
              disabled={!isAuthenticated || pendingBookingIds.length === 0}
              value={paymentForm.paymentMethod}
              onChange={(event) => {
                const method = event.target.value
                setPaymentForm((current) => ({
                  ...current,
                  paymentMethod: method,
                  cardHolderName: method === 'Card' ? current.cardHolderName : '',
                  cardNumber: method === 'Card' ? current.cardNumber : '',
                  upiId: method === 'UPI' ? current.upiId : '',
                }))
                setPaymentErrors({
                  paymentMethod: '',
                  cardHolderName: '',
                  cardNumber: '',
                  upiId: '',
                })
              }}
            >
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </label>

          {paymentForm.paymentMethod === 'Card' ? (
            <>
              <label>
                <span>Card holder name</span>
                <input
                  type="text"
                  required
                  disabled={!isAuthenticated || pendingBookingIds.length === 0}
                  minLength={2}
                  autoComplete="cc-name"
                  value={paymentForm.cardHolderName}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      cardHolderName: event.target.value,
                    }))
                  }
                  placeholder="Name on card"
                />
              {paymentErrors.cardHolderName ? (
                <p className="field-error">{paymentErrors.cardHolderName}</p>
              ) : null}
            </label>

            <label>
              <span>Card number</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength="19"
                pattern="^[0-9]{12,19}$"
                required
                disabled={!isAuthenticated || pendingBookingIds.length === 0}
                autoComplete="cc-number"
                value={paymentForm.cardNumber}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    cardNumber: event.target.value.replace(/[^\d]/g, ''),
                  }))
                }
                placeholder="4111111111111111"
              />
              {paymentErrors.cardNumber ? (
                <p className="field-error">{paymentErrors.cardNumber}</p>
              ) : null}
            </label>
          </>
        ) : (
          <label>
            <span>UPI tag</span>
            <input
              type="text"
              required
              pattern="^[A-Za-z0-9._-]+@[A-Za-z]+$"
              title="Use a valid UPI tag like name@bank"
              disabled={!isAuthenticated || pendingBookingIds.length === 0}
              autoComplete="off"
              value={paymentForm.upiId}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  upiId: event.target.value,
                }))
              }
              placeholder="name@bank"
            />
            {paymentErrors.upiId ? <p className="field-error">{paymentErrors.upiId}</p> : null}
          </label>
        )}

          {paymentErrors.paymentMethod ? <p className="field-error">{paymentErrors.paymentMethod}</p> : null}

          {pendingBookingIds.length > 0 ? (
            <div className="booking-highlight booking-highlight--inline">
              <strong>Payment IDs</strong>
              <span>{pendingPaymentIds.join(', ') || '-'}</span>
              <p>These payment records will be marked as paid after processing.</p>
            </div>
          ) : (
            <p className="page-note">Book your seats first to unlock payment.</p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={
              paymentLoading ||
              !isAuthenticated ||
              pendingBookingIds.length === 0 ||
              paymentWindowExpired
            }
          >
            {paymentWindowExpired ? 'Payment expired' : paymentLoading ? 'Processing...' : 'Pay now'}
          </button>
        </form>
      </div>
    </section>
  )
}
