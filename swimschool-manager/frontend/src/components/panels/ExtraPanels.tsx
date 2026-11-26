import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AuthUser, ClientItem, FacilityItem } from "../../types/api";
import { BookingsTable } from "../BookingsTable";

export function AttendancePanel() {
  return (
    <div className="panel-card">
      <h3>Obecności i rozliczanie wejść</h3>
      <p className="panel-muted">
        Potwierdzenie obecności automatycznie zmienia status rezerwacji na{" "}
        <code>ATTENDED</code> i zdejmuje jedno wejście z przypisanego karnetu.
      </p>
      <BookingsTable />
    </div>
  );
}

export function ContractsPanel() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getClients()
      .then((data) => {
        if (active) setClients(data);
      })
      .catch(() => {
        if (active) setClients([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="panel-stack">
      <div className="panel-note">
        <strong>Moduł umów (<code>contract_documents</code>):</strong> Tabela w
        PostgreSQL jest już gotowa i zawiera przykładowe umowy. Po dodaniu
        endpointów <code>GET/POST /api/contracts</code> w backendzie wyświetlisz
        tutaj status podpisu oraz pliki PDF umów dla poniższych kursantów.
      </div>

      <div className="panel-card">
        <h3>Kursanci w bazie</h3>
        {loading ? (
          <p className="panel-muted">Ładowanie listy kursantów...</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kursant</th>
                  <th>Telefon</th>
                  <th>E-mail</th>
                  <th>Status konta</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>
                        {c.first_name} {c.last_name}
                      </strong>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.email ?? "—"}</td>
                    <td>
                      <span className="status-badge badge-active">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AccountPanel({ user }: { user: AuthUser }) {
  return (
    <div className="panel-card">
      <h3>Moje dane użytkownika</h3>
      <div className="info-grid">
        <div className="info-item">
          <span>Imię i nazwisko</span>
          <strong>
            {user.first_name} {user.last_name}
          </strong>
        </div>
        <div className="info-item">
          <span>E-mail</span>
          <strong>{user.email}</strong>
        </div>
        <div className="info-item">
          <span>Rola</span>
          <strong>{user.role}</strong>
        </div>
        <div className="info-item">
          <span>Identyfikator</span>
          <strong>
            <code>{user.id}</code>
          </strong>
        </div>
      </div>
    </div>
  );
}

export function InfoPanel() {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);

  useEffect(() => {
    let active = true;
    api
      .getFacilities()
      .then((data) => {
        if (active) setFacilities(data);
      })
      .catch(() => {
        if (active) setFacilities([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="panel-stack">
      <div className="panel-card">
        <h3>Komunikaty szkółki</h3>
        <p className="panel-muted">
          Witamy w systemie AQUA MANAGER. Poniżej znajdziesz listę naszych
          pływalni, na których odbywają się zajęcia.
        </p>
      </div>
      <div className="panel-card">
        <h3>Nasze obiekty</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Obiekt</th>
                <th>Adres</th>
                <th>Miasto</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>{f.name}</strong>
                  </td>
                  <td>{f.address ?? "—"}</td>
                  <td>{f.city ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
