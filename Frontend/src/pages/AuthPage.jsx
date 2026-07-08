import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp, isAuthenticated } = useAuth()

  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Passenger',
  })

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await signIn(loginForm)
      setMessage('Login successful. We saved your session.')
      navigate('/profile')
    } catch (submitError) {
      setError(submitError.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await signUp(registerForm)
      setMessage('Registration successful. You can sign in now.')
      setMode('login')
      setLoginForm((current) => ({
        ...current,
        email: registerForm.email,
      }))
    } catch (submitError) {
      setError(submitError.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-hero">
        <div className="section-heading auth-heading">
          <p className="eyebrow">Auth</p>
          <h2>Login and registration</h2>
          <p>Sign in to manage bookings and payments, or create an account to get started.</p>
        </div>

        {isAuthenticated ? (
          <div className="auth-signed-in">
            <strong>You are already signed in.</strong>
            <button type="button" className="primary-button" onClick={() => navigate('/profile')}>
              Open profile
            </button>
          </div>
        ) : null}
      </div>

      <div className="auth-shell">
        <div className="mode-switch" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={mode === 'login' ? 'mode-button active' : 'mode-button'}
            onClick={() => {
              setMode('login')
              setMessage('')
              setError('')
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'mode-button active' : 'mode-button'}
            onClick={() => {
              setMode('register')
              setMessage('')
              setError('')
            }}
          >
            Register
          </button>
        </div>

        {message ? <p className="form-message success">{message}</p> : null}
        {error ? <p className="form-message error">{error}</p> : null}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                required
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <label>
              <span>Full name</span>
              <input
                type="text"
                name="fullName"
                required
                value={registerForm.fullName}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                required
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Role</span>
              <select
                name="role"
                value={registerForm.role}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
              >
                <option value="Passenger">Passenger</option>
                <option value="FlightOwner">Flight Owner</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
