import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { ClientItem, PassItem, SessionItem } from "../../types/api";
import { BookingsTable } from "../BookingsTable";

export function BookingsPanel() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [passes, setPasses] = useState<PassItem[]>([]);

  const [clientId, setClientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [passId, setPassId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        const [clientsData, sessionsData] = await Promise.all([
          api.getClients(),
          api.getSessions(),
        ]);
        if (!active) return;
        setClients(clientsData);
        setSessions(sessionsData.filter((s) => !s.is_cancelled));
        if (clientsData.length > 0) setClientId(clientsData[0].id);
        if (sessionsData.length > 0) setSessionId(sessionsData[0].id);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać listy kursantów lub zajęć."
          );
        }
      }
    }
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    async function loadPasses() {
      try {
        const data = await api.getClientPasses(clientId);
        if (!active) return;
        setPasses(data);
        const activePass = data.find((p) => p.status === "ACTIVE");
        setPassId(activePass ? activePass.id : "");
      } catch {
        if (active) {
          setPasses([]);
          setPassId("");
        }
      }
    }
    loadPasses();
    return () => {
      active = false;
    };
  }, [clientId]);

  async function handleCreateBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientId || !sessionId) {
      setError("Wybierz kursanta i termin zajęć.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      await api.createBooking({
        client_id: clientId,
        lesson_session_id: sessionId,
        pass_id: passId || null,
      });
      setSuccess("Rezerwacja została utworzona.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się utworzyć rezerwacji."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel-stack">
      <div className="panel-card">
        <h3>Nowa rezerwacja</h3>
        <form className="panel-form" onSubmit={handleCreateBooking}>
          <div className="form-grid">
            <label className="form-field">
              <span>Kursant</span>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Zajęcia</span>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.start_time).toLocaleString("pl-PL")} —{" "}
                    {s.facility_name} ({s.instructor_name})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Karnet (opcjonalnie)</span>
              <select
                value={passId}
                onChange={(e) => setPassId(e.target.value)}
              >
                <option value="">Bez karnetu (pojedyncze wejście)</option>
                {passes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.counter} ({p.status}, do {p.valid_until})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="panel-error">{error}</p>}
          {success && <p className="panel-success">{success}</p>}

          <button type="submit" className="primary-action" disabled={submitting}>
            {submitting ? "Zapisywanie..." : "Zapisz na zajęcia"}
          </button>
        </form>
      </div>

      <div className="panel-card">
        <h3>Lista rezerwacji</h3>
        <BookingsTable key={refreshKey} />
      </div>
    </div>
  );
}
