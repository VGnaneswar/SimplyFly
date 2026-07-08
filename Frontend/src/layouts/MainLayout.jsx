import Navbar from '../components/Navbar.jsx'
import { navigationItems } from '../data/navigation.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function MainLayout({ children }) {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="app-frame">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar
        items={navigationItems}
        user={user}
        isAuthenticated={isAuthenticated}
      />
      <main className="app-shell">{children}</main>
    </div>
  )
}
