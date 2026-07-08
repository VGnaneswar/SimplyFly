import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OverviewPage() {
  const navigate = useNavigate()
  const [clock, setClock] = useState(() => new Date())
  const [searchForm, setSearchForm] = useState({
    origin: '',
    destination: '',
    date: '',
  })

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function handleSearchSubmit(event) {
    event.preventDefault()

    const params = new URLSearchParams({
      mode: 'search',
      origin: searchForm.origin,
      destination: searchForm.destination,
      date: searchForm.date,
    })

    navigate(`/flights?${params.toString()}`)
  }

  return (
    <section className="overview-board" aria-label="Overview search page">
      <section className="overview-hero">
        <div className="overview-topline">
          <div>
            <p className="overview-kicker">Search flights</p>
            <h1>Find your next route in one step.</h1>
            
          </div>

          <div className="overview-clock" aria-live="polite">
            <span className="overview-clock__label">Current time</span>
            <strong>
              {clock.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </strong>
            <span className="overview-clock__sub">Updated live</span>
          </div>
        </div>

        <form className="search-shell" aria-label="Search flights" onSubmit={handleSearchSubmit}>
          <div className="search-shell__fields">
            <label>
              <span>Leaving from</span>
              <input
                type="text"
                placeholder="Choose origin"
                value={searchForm.origin}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    origin: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Going to</span>
              <input
                type="text"
                placeholder="Choose destination"
                value={searchForm.destination}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    destination: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Departure</span>
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
          <div className="search-shell__actions">
            <button type="submit" className="primary-button">
              Search flights
            </button>
          </div>
        </form>
      </section>
    </section>
  )
}
