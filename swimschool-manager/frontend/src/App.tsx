import { useState, type FormEvent } from 'react'
import './App.css'
import { api } from './api/client'
import { BookingsTable } from './components/BookingsTable'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    setPassword('')
    setError(null)
  }

  if (user) {
    return (
      <div className="dashboard">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">≋</div>
            <div>
              <strong>AQUA MANAGER</strong>
              <span>SYSTEM ZARZĄDZANIA</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            Wyloguj się ↗
          </button>
        </header>

        <main className="dashboard-content">
          <div className="welcome-label">PANEL UŻYTKOWNIKA</div>
          <h1>Witaj, {user.first_name}!</h1>
          <p className="dashboard-description">
            Zalogowano jako:{' '}
            <strong>
              {user.first_name} {user.last_name} ({roleNames[user.role]})
            </strong>
          </p>

          <div className="dashboard-grid">
            {user.role === 'ADMIN' && (
              <>
                <DashboardCard
                  icon="♙"
                  title="Użytkownicy"
                  description="Zarządzaj kontami i uprawnieniami."
                />
                <DashboardCard
                  icon="▦"
                  title="Grupy pływackie"
                  description="Zarządzaj grupami i przydziałami."
                />
                <DashboardCard
                  icon="◷"
                  title="Harmonogram"
                  description="Zarządzaj terminami zajęć."
                />
                <DashboardCard
                  icon="▤"
                  title="Raporty"
                  description="Przeglądaj dane i statystyki."
                />
              </>
            )}

            {user.role === 'RECEPTION' && (
              <>
                <DashboardCard
                  icon="♙"
                  title="Kursanci"
                  description="Zarządzaj kartotekami i opiekunami."
                />
                <DashboardCard
                  icon="◷"
                  title="Rezerwacje"
                  description="Obsługuj zapisy i odwołania zajęć."
                />
                <DashboardCard
                  icon="▤"
                  title="Karnety"
                  description="Sprawdzaj ważność i liczniki lekcji."
                />
                <DashboardCard
                  icon="✓"
                  title="Umowy"
                  description="Zarządzaj dokumentami kursantów."
                />
              </>
            )}

            {user.role === 'INSTRUCTOR' && (
              <>
                <DashboardCard
                  icon="♙"
                  title="Moje grupy"
                  description="Przeglądaj przypisane grupy."
                />
                <DashboardCard
                  icon="◷"
                  title="Harmonogram"
                  description="Sprawdź swoje nadchodzące zajęcia."
                />
                <DashboardCard
                  icon="✓"
                  title="Obecności"
                  description="Zarządzaj obecnością uczestników."
                />
                <DashboardCard
                  icon="▤"
                  title="Poziomy i uwagi"
                  description="Przeglądaj poziom i notatki o kursantach."
                />
              </>
            )}

            {user.role === 'USER' && (
              <>
                <DashboardCard
                  icon="♙"
                  title="Moje konto"
                  description="Przeglądaj swoje dane."
                />
                <DashboardCard
                  icon="◷"
                  title="Moje zajęcia"
                  description="Sprawdź przypisane zajęcia."
                />
                <DashboardCard
                  icon="▤"
                  title="Informacje"
                  description="Sprawdź komunikaty szkółki."
                />
              </>
            )}
          </div>

          {(user.role === 'ADMIN' ||
            user.role === 'RECEPTION' ||
            user.role === 'INSTRUCTOR') && (
            <section style={{ marginTop: '2.5rem' }}>
              <h2>Bieżące rezerwacje i obecności (dane z bazy PostgreSQL)</h2>
              <BookingsTable />
            </section>
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
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="dashboard-card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="card-arrow">Otwórz moduł →</span>
    </div>
  )
}

export default App
