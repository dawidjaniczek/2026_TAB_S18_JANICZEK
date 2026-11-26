import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { ClientItem, SkillLevel } from "../../types/api";

const skillLabels: Record<SkillLevel, string> = {
  BEGINNER: "Początkujący",
  INTERMEDIATE: "Średniozaawansowany",
  ADVANCED: "Zaawansowany",
};

interface ClientsPanelProps {
  canCreate?: boolean;
  heading?: string;
}

export function ClientsPanel({
  canCreate = false,
  heading = "Kartoteka kursantów",
}: ClientsPanelProps) {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillFilter, setSkillFilter] = useState<string>("ALL");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("BEGINNER");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  async function loadClients() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getClients();
      setClients(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać listy kursantów."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .getClients()
      .then((data) => {
        if (active) {
          setClients(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać listy kursantów."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setFormError("Imię, nazwisko i telefon są wymagane.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      setFormSuccess(null);
      await api.createClient({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        birth_date: birthDate || null,
        skill_level: skillLevel,
        notes: notes.trim() || null,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setBirthDate("");
      setSkillLevel("BEGINNER");
      setNotes("");
      setFormSuccess("Nowy kursant został dodany do kartoteki.");
      await loadClients();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Nie udało się dodać kursanta."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredClients =
    skillFilter === "ALL"
      ? clients
      : clients.filter((c) => c.skill_level === skillFilter);

  return (
    <div className="panel-stack">
      {canCreate && (
        <div className="panel-card">
          <h3>Dodaj nowego kursanta</h3>
          <form className="panel-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label className="form-field">
                <span>Imię *</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Nazwisko *</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Telefon *</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Data urodzenia</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Poziom umiejętności</span>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                >
                  {Object.entries(skillLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="form-field">
              <span>Notatki / uwagi</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. preferowane godziny, wskazówki zdrowotne"
              />
            </label>

            {formError && <p className="panel-error">{formError}</p>}
            {formSuccess && <p className="panel-success">{formSuccess}</p>}

            <button
              type="submit"
              className="primary-action"
              disabled={submitting}
            >
              {submitting ? "Dodawanie..." : "Dodaj kursanta"}
            </button>
          </form>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-card-header">
          <div>
            <h3>{heading}</h3>
            <p className="panel-muted">
              Dane z tabeli <code>clients</code>.
            </p>
          </div>
          <div className="header-actions">
            <select
              className="inline-select"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              aria-label="Filtruj poziom"
            >
              <option value="ALL">Wszystkie poziomy</option>
              <option value="BEGINNER">Początkujący</option>
              <option value="INTERMEDIATE">Średniozaawansowany</option>
              <option value="ADVANCED">Zaawansowany</option>
            </select>
            <span className="count-pill">{filteredClients.length} os.</span>
          </div>
        </div>

        {loading && <p className="panel-muted">Ładowanie kursantów...</p>}
        {error && <p className="panel-error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kursant</th>
                  <th>Kontakt</th>
                  <th>Data ur.</th>
                  <th>Poziom</th>
                  <th>Status</th>
                  <th>Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      Brak kursantów spełniających kryteria.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <strong>
                          {client.first_name} {client.last_name}
                        </strong>
                      </td>
                      <td>
                        <div>{client.phone}</div>
                        {client.email && (
                          <div className="sub-text">{client.email}</div>
                        )}
                      </td>
                      <td>{client.birth_date ?? "—"}</td>
                      <td>
                        <span className="status-badge badge-info">
                          {skillLabels[client.skill_level]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            client.status === "ACTIVE"
                              ? "badge-active"
                              : "badge-warn"
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td>{client.notes ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
