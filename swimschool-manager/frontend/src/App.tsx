
import { useState } from 'react'
import './App.css'

type Role = 'admin' | 'instructor' | 'user'

function App() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<Role>('instructor')
    const [loggedIn, setLoggedIn] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const roleNames = {
        admin: 'Administrator',
        instructor: 'Instruktor',
        user: 'Użytkownik',
    }

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!email || !password) {
            alert('Wprowadź adres e-mail i hasło.')
            return
        }

        // Prototyp - logowanie demonstracyjne, bez backendu.
        setLoggedIn(true)
    }

    const handleLogout = () => {
        setLoggedIn(false)
        setPassword('')
    }

    if (loggedIn) {
        return (
            <div className= "dashboard" >
            <header className="topbar" >
                <div className="brand" >
                    <div className="brand-icon" >≋</div>
                        < div >
                        <strong>AQUA MANAGER </strong>
                            < span > SYSTEM ZARZĄDZANIA </span>
                                </div>
                                </div>

                                < button className = "logout-button" onClick = { handleLogout } >
                                    Wyloguj się ↗
        </button>
            </header>

            < main className = "dashboard-content" >
                <div className="welcome-label" > PANEL UŻYTKOWNIKA </div>
                    < h1 > Witaj w systemie! </h1>
                        < p className = "dashboard-description" >
                            Zalogowano jako: <strong>{ roleNames[role]} </strong>
                                </p>

                                < div className = "dashboard-grid" >
                                { role === 'admin' && (
                                        <>
                                        <DashboardCard icon="♙" title = "Użytkownicy"
        description = "Zarządzaj kontami i uprawnieniami." />
            <DashboardCard icon="▦" title = "Grupy pływackie"
        description = "Zarządzaj grupami i przydziałami." />
            <DashboardCard icon="◷" title = "Harmonogram"
        description = "Zarządzaj terminami zajęć." />
            <DashboardCard icon="▤" title = "Raporty"
        description = "Przeglądaj dane i statystyki." />
            </>
            )
    }

    {
        role === 'instructor' && (
            <>
            <DashboardCard icon="♙" title = "Moje grupy"
        description = "Przeglądaj przypisane grupy." />
            <DashboardCard icon="◷" title = "Harmonogram"
        description = "Sprawdź swoje nadchodzące zajęcia." />
            <DashboardCard icon="✓" title = "Obecności"
        description = "Zarządzaj obecnością uczestników." />
            <DashboardCard icon="▤" title = "Postępy"
        description = "Przeglądaj postępy kursantów." />
            </>
            )
    }

    {
        role === 'user' && (
            <>
            <DashboardCard icon="♙" title = "Moje konto"
        description = "Przeglądaj swoje dane." />
            <DashboardCard icon="◷" title = "Moje zajęcia"
        description = "Sprawdź przypisane zajęcia." />
            <DashboardCard icon="▤" title = "Informacje"
        description = "Sprawdź komunikaty szkółki." />
            </>
            )
    }
    </div>
        </main>
        </div>
    )
}

return (
    <div className= "login-page" >
    <section className="visual-panel" >
        <div className="visual-brand" >
            <div className="brand-icon" >≋</div>
                < div >
                <strong>AQUA MANAGER </strong>
                    < span > SWIMMING SCHOOL SYSTEM </span>
                        </div>
                        </div>

                        < div className = "visual-content" >
                            <div className="eyebrow" >
                                <span className="eyebrow-dot" />
                                    SYSTEM ZARZĄDZANIA SZKÓŁKĄ
                                        </div>

                                        <h1>
            Razem tworzymy
    < br />
    <span>silną drużynę.</span>
        </h1>

        <p>
            Jedno miejsce do zarządzania zajęciami,
    instruktorami i organizacją szkółki pływackiej.
          </p>

        < div className = "pool-decoration" >
            <div className="pool-line line-one" />
                <div className="pool-line line-two" />
                    <div className="pool-line line-three" />
                        <div className="pool-line line-four" />
                            </div>
                            </div>

                            < div className = "visual-footer" >
                                <span>PROFESJONALIZM </span>
                                <span>•</span>
                                    < span > ZAANGAŻOWANIE </span>
                                    <span>•</span>
                                        < span > PASJA DO PŁYWANIA </span>
                                            </div>
                                            </section>

                                            < section className = "form-panel" >
                                                <div className="login-box" >
                                                    <div className="mobile-brand" >
                                                        <div className="brand-icon" >≋</div>
                                                            < strong > AQUA MANAGER </strong>
                                                                </div>

                                                                < div className = "form-heading" >
                                                                    <div className="form-label" > STREFA LOGOWANIA </div>
                                                                        < h2 > Witaj ponownie! </h2>
                                                                            < p > Zaloguj się, aby uzyskać dostęp do systemu.</p>
                                                                                </div>

                                                                                < form onSubmit = { handleLogin } >
                                                                                <div className="field" >
                                                                                    <label htmlFor="role" > ROLA UŻYTKOWNIKA </label>
                                                                                        < select
id = "role"
value = { role }
onChange = {(e) => setRole(e.target.value as Role)}
              >
    <option value="admin" > Administrator </option>
        < option value = "instructor" > Instruktor </option>
            < option value = "user" > Użytkownik </option>
                </select>
                </div>

                < div className = "field" >
                    <label htmlFor="email" > ADRES E - MAIL </label>
                        < input
id = "email"
type = "email"
placeholder = "np. instruktor@szkolka.pl"
value = { email }
onChange = {(e) => setEmail(e.target.value)}
required
    />
    </div>

    < div className = "field" >
        <label htmlFor="password" > HASŁO </label>
            < div className = "password-wrapper" >
                <input
                  id="password"
type = { showPassword? 'text': 'password' }
placeholder = "Wprowadź hasło"
value = { password }
onChange = {(e) => setPassword(e.target.value)}
required
    />
    <button
                  type="button"
className = "show-password"
onClick = {() => setShowPassword(!showPassword)}
                >
{ showPassword? 'Ukryj': 'Pokaż' }
    </button>
    </div>
    </div>

    < button type = "submit" className = "login-button" >
        Zaloguj się<span>→</span>
            </button>
            </form>

            < div className = "security-info" >
                <span>◈</span>
            Dostęp do systemu przeznaczony dla uprawnionych osób.
          </div>
    </div>

    < footer className = "form-footer" >
          © 2026 AQUA MANAGER
    < span > WERSJA PROTOTYPOWA </span>
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
        <div className= "dashboard-card" >
        <div className="card-icon" > { icon } </div>
            < h3 > { title } </h3>
            < p > { description } </p>
            < span className = "card-arrow" > Otwórz moduł →</span>
                </div>
  )
}

export default App
