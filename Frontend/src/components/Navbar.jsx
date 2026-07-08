import { Link, NavLink } from 'react-router-dom'
import brandMark from '../assets/clipart900500.png'

export default function Navbar({ items, user, isAuthenticated }) {
  const visibleItems = items.filter((item) => {
    if (item.guestOnly && isAuthenticated) {
      return false
    }

    if (!item.roles) {
      return true
    }

    return item.roles.includes(user?.role)
  })

  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <img className="brand__icon" src={brandMark} alt="" aria-hidden="true" />
        <span>SimplyFly</span>
      </Link>
      <div className="topbar-actions">
        <nav aria-label="Primary">
          <ul className="nav-list">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="auth-chip">
          {isAuthenticated ? (
            <span>
              {user?.email || 'Signed in'} | {user?.role || 'Passenger'}
            </span>
          ) : (
            <span>Guest mode</span>
          )}
        </div>
      </div>
    </header>
  )
}
