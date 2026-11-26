import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import { api } from './api/client'
import { BookingsTable } from './components/BookingsTable'
import { PanelView } from './components/panels/PanelView'
import {
  MODULES_BY_ROLE,
  getModuleFromPath,
  getModulePath,
  type DashboardModule,
} from './components/panels/moduleConfig'
import type { AuthUser, UserRole } from './types/api'

const roleNames: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  RECEPTION: 'Recepcja',
  INSTRUCTOR: 'Instruktor',
  USER: 'Użytkownik',
}

function getSavedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('swimschool_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(getSavedUser)
  const [activeModule, setActiveModule] = useState<DashboardModule | null>(() => {
    const saved = getSavedUser()
    return saved ? getModuleFromPath(window.location.pathname, saved.role) : null
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handlePopState = () => {
      if (!user) {
        setActiveModule(null)
        return
      }
      setActiveModule(getModuleFromPath(window.location.pathname, user.role))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user])

  const openModule = (mod: DashboardModule) => {
    const targetPath = getModulePath(mod.slug)
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ moduleId: mod.id }, '', targetPath)
    }
    setActiveModule(mod)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
    setActiveModule(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Wprowadź adres e-mail i hasło.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const loggedUser = await api.login(email, password)
      localStorage.setItem('swimschool_user', JSON.stringify(loggedUser))
      setUser(loggedUser)
      const matchedModule = getModuleFromPath(
        window.location.pathname,
        loggedUser.role
      )
      setActiveModule(matchedModule)
      if (!matchedModule && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/')
      }
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zalogować.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('swimschool_user')
    setUser(null)
    setActiveModule(null)
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
    setPassword('')
    setError(null)
  }

  if (user) {
    const roleModules = MODULES_BY_ROLE[user.role]

    return (
      <div className="dashboard">
        <header className="topbar">
          <button
            type="button"
            className="brand brand-button"
            onClick={goHome}
            title="Wróć do panelu głównego"
          >
            <div className="brand-icon">≋</div>
            <div>
              <strong>AQUA MANAGER</strong>
              <span>SYSTEM ZARZĄDZANIA</span>
            </div>
          </button>

          <div className="topbar-actions">
            <span className="topbar-user">
              {user.first_name} {user.last_name} ({roleNames[user.role]})
            </span>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Wyloguj się ↗
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {activeModule ? (
            <PanelView
              user={user}
              module={activeModule}
              onBack={goHome}
              onSelectModule={openModule}
            />
          ) : (
            <>
              <div className="welcome-label">PANEL UŻYTKOWNIKA</div>
              <h1>Witaj, {user.first_name}!</h1>
              <p className="dashboard-description">
                Zalogowano jako:{' '}
                <strong>
                  {user.first_name} {user.last_name} ({roleNames[user.role]})
                </strong>
              </p>

              <div className="dashboard-grid">
                {roleModules.map((mod) => (
                  <DashboardCard
                    key={mod.id}
                    icon={mod.icon}
                    title={mod.title}
                    description={mod.description}
                    onClick={() => openModule(mod)}
                  />
                ))}
              </div>

              {(user.role === 'ADMIN' ||
                user.role === 'RECEPTION' ||
                user.role === 'INSTRUCTOR') && (
                <section className="dashboard-bookings-section">
                  <h2>Bieżące rezerwacje i obecności (dane z bazy PostgreSQL)</h2>
                  <div className="panel-card">
                    <BookingsTable />
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="login-page">
      <section className="visual-panel">
        <div className="visual-brand">
          <div className="brand-icon">≋</div>
          <div>
            <strong>AQUA MANAGER</strong>
            <span>SWIMMING SCHOOL SYSTEM</span>
          </div>
        </div>

        <div className="visual-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            SYSTEM ZARZĄDZANIA SZKÓŁKĄ
          </div>

          <h1>
            Razem tworzymy
            <br />
            <span>silną drużynę.</span>
          </h1>

          <p>
            Jedno miejsce do zarządzania zajęciami, instruktorami i organizacją
            szkółki pływackiej.
          </p>

          <div className="pool-decoration">
            <div className="pool-line line-one" />
            <div className="pool-line line-two" />
            <div className="pool-line line-three" />
            <div className="pool-line line-four" />
          </div>
        </div>

        <div className="visual-footer">
          <span>PROFESJONALIZM</span>
          <span>•</span>
          <span>ZAANGAŻOWANIE</span>
          <span>•</span>
          <span>PASJA DO PŁYWANIA</span>
        </div>
      </section>

      <section className="form-panel">
        <div className="login-box">
          <div className="mobile-brand">
            <div className="brand-icon">≋</div>
            <strong>AQUA MANAGER</strong>
          </div>

          <div className="form-heading">
            <div className="form-label">STREFA LOGOWANIA</div>
            <h2>Witaj ponownie!</h2>
            <p>Zaloguj się, aby uzyskać dostęp do systemu.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">ADRES E-MAIL</label>
              <input
                id="email"
                type="email"
                placeholder="np. admin@1.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">HASŁO</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Wprowadź hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ukryj' : 'Pokaż'}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="security-info">
            <span>◈</span>
            Dostęp do systemu przeznaczony dla uprawnionych osób.
          </div>
        </div>

        <footer className="form-footer">
          © 2026 AQUA MANAGER
          <span>WERSJA PROTOTYPOWA</span>
        </footer>
      </section>
    </div>
  )
}

function DashboardCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button type="button" className="dashboard-card" onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="card-arrow">Otwórz moduł →</span>
    </button>
  )
}

export default App
