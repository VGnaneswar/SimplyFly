import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <article className="not-found-card">
        <p className="eyebrow">404</p>
        <h2>That page took a wrong turn</h2>
        <p>
          We could not find the page you were looking for. Let&apos;s head back to SimplyFly and
          keep your trip moving.
        </p>

        <div className="not-found-actions">
          <Link className="primary-button" to="/">
            Back to overview
          </Link>
          <Link className="secondary-button" to="/flights">
            Browse flights
          </Link>
        </div>
      </article>
    </section>
  )
}
