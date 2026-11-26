import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AuthUser, InstructorItem } from "../../types/api";

interface UsersPanelProps {
  currentUser: AuthUser;
}

export function UsersPanel({ currentUser }: UsersPanelProps) {
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getInstructors();
        if (active) setInstructors(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać listy instruktorów."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="panel-stack">
      <div className="panel-card">
        <h3>Twoje konto administratora</h3>
        <div className="info-grid">
          <div className="info-item">
            <span>Imię i nazwisko</span>
            <strong>
              {currentUser.first_name} {currentUser.last_name}
            </strong>
          </div>
          <div className="info-item">
            <span>E-mail</span>
            <strong>{currentUser.email}</strong>
          </div>
          <div className="info-item">
            <span>Rola</span>
            <strong>
              <span className="status-badge badge-info">{currentUser.role}</span>
            </strong>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Instruktorzy w systemie</h3>
            <p className="panel-muted">
              Dane pobierane bezpośrednio z endpointu <code>GET /api/instructors</code>.
            </p>
          </div>
          <span className="count-pill">{instructors.length} os.</span>
        </div>

        {loading && <p className="panel-muted">Ładowanie listy instruktorów...</p>}
        {error && <p className="panel-error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th>Rola</th>
                </tr>
              </thead>
              <tbody>
                {instructors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      Brak instruktorów w bazie danych.
                    </td>
                  </tr>
                ) : (
                  instructors.map((inst) => (
                    <tr key={inst.id}>
                      <td>
                        <strong>
                          {inst.first_name} {inst.last_name}
                        </strong>
                      </td>
                      <td>{inst.email}</td>
                      <td>{inst.phone}</td>
                      <td>
                        <span className="status-badge badge-active">
                          INSTRUCTOR
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel-note">
        <strong>Rozbudowa modułu:</strong> Obecnie backend udostępnia listę
        instruktorów (<code>/api/instructors</code>). Po dodaniu routera{" "}
        <code>/api/users</code> w FastAPI w tym miejscu podepniesz pełne
        dodawanie/edycję kont personelu (<code>ADMIN</code>,{" "}
        <code>RECEPTION</code>) oraz kwalifikacji instruktorów.
      </div>
    </div>
  );
}
