import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getFlights, searchFlights } from '../services/api.js'
import { formatCurrency, formatDateTime, getFlightList } from './pageUtils.js'

export default function FlightsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [isFilteredView, setIsFilteredView] = useState(false)
  const [searchForm, setSearchForm] = useState({
    origin: '',
    destination: '',
    date: '',
  })

  const hasResults = results.length > 0

  const summaryText = useMemo(() => {
    return isFilteredView
      ? `Showing ${results.length} matching flights`
      : `Showing all ${results.length} available flights`
  }, [isFilteredView, results.length])

  async function loadAllFlights() {
    setLoading(true)
    setError('')

    try {
      const response = await getFlights({ pageNumber: 1, pageSize: 200, sortBy: 'departure' })
      setResults(getFlightList(response))
      setIsFilteredView(false)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load flights.')
    } finally {
      setLoading(false)
    }
  }

  async function runSearch(filters) {
    setLoading(true)
    setError('')

    try {
      const response = await searchFlights(filters)
      setResults(response?.data ?? [])
      setIsFilteredView(true)
    } catch (requestError) {
      setError(requestError.message || 'Unable to search flights.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault()
    await runSearch(searchForm)
  }

  useEffect(() => {
    const modeFromQuery = searchParams.get('mode')
    const origin = searchParams.get('origin') ?? ''
    const destination = searchParams.get('destination') ?? ''
    const date = searchParams.get('date') ?? ''

    if (modeFromQuery !== 'search' || (!origin && !destination && !date)) {
      loadAllFlights()
      return
    }

    const nextSearch = {
      origin,
      destination,
      date,
    }

    setSearchForm(nextSearch)
    runSearch(nextSearch)
  }, [searchParams])

  return (
    <section className="flights-page">
      <div className="flights-hero">
        <div className="section-heading flights-heading">
          <p className="eyebrow">Flights</p>
          <h2>Search flights and choose your route</h2>
          <p>
            Browse every available flight, or filter by route and date to jump straight to the
            best match.
          </p>
        </div>

        <form className="flights-search" onSubmit={handleSearchSubmit}>
          <div className="flights-search__fields">
            <label>
              <span>Origin</span>
              <input
                type="text"
                value={searchForm.origin}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    origin: event.target.value,
                  }))
                }
                placeholder="e.g. Delhi"
              />
            </label>
            <label>
              <span>Destination</span>
              <input
                type="text"
                value={searchForm.destination}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    destination: event.target.value,
                  }))
                }
                placeholder="e.g. Mumbai"
              />
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={searchForm.date}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="flights-search__actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Searching...' : 'Search flights'}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setSearchForm({
                  origin: '',
                  destination: '',
                  date: '',
                })
                loadAllFlights()
              }}
              disabled={loading}
            >
              Show all flights
            </button>
          </div>
        </form>
      </div>

      <section className="flights-results">
        <div className="results-header">
          <div>
            <p className="results-header__eyebrow">
              {isFilteredView ? 'Filtered results' : 'All flights'}
            </p>
            <h3>{summaryText}</h3>
          </div>
          <p className="results-header__copy">
            Select any flight below to continue into seat selection and booking.
          </p>
        </div>

        {error ? <p className="form-message error">{error}</p> : null}
        {loading ? <p className="page-note">Loading flights...</p> : null}

        {!loading && !hasResults ? (
          <p className="page-note">
            {isFilteredView
              ? 'No flights matched this search. Try a different route or date.'
              : 'No flights are available right now.'}
          </p>
        ) : null}

        <div className="flight-grid">
          {results.map((flight) => (
            <article
              className="flight-card flight-card--clickable"
              key={flight.id ?? flight.Id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/bookings?flightId=${flight.id ?? flight.Id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/bookings?flightId=${flight.id ?? flight.Id}`)
                }
              }}
            >
              <div className="flight-card__top">
                <div>
                  <p className="flight-number">{flight.flightNumber ?? flight.FlightNumber}</p>
                  <h3>{flight.flightName ?? flight.FlightName}</h3>
                </div>
                <strong className="fare">
                  {formatCurrency(flight.fare ?? flight.Fare ?? 0)}
                </strong>
              </div>

              <p className="route">
                {((flight.origin ?? flight.Origin) || 'Origin')} to{' '}
                {((flight.destination ?? flight.Destination) || 'Destination')}
              </p>

              <dl className="flight-meta">
                <div>
                  <dt>Departure</dt>
                  <dd>{formatDateTime(flight.departureTime ?? flight.DepartureTime)}</dd>
                </div>
                <div>
                  <dt>Arrival</dt>
                  <dd>{formatDateTime(flight.arrivalTime ?? flight.ArrivalTime)}</dd>
                </div>
                <div>
                  <dt>Seats</dt>
                  <dd>
                    {flight.availableSeats ?? flight.AvailableSeats} /{' '}
                    {flight.totalSeats ?? flight.TotalSeats}
                  </dd>
                </div>
              </dl>

              <div className="flight-card__action">Choose seats and continue</div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
