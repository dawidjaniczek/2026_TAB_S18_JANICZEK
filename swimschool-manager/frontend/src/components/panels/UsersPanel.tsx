import { Fragment, useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type {
  ClientItem,
  ClientStatus,
  InstructorItem,
  SkillLevel,
} from "../../types/api";
import { ClientDetailsDrawer } from "./ClientDetailsDrawer";

const skillLabels: Record<SkillLevel, string> = {
  BEGINNER: "Początkujący",
  INTERMEDIATE: "Średniozaawansowany",
  ADVANCED: "Zaawansowany",
};

const clientStatusLabels: Record<ClientStatus, string> = {
  ACTIVE: "Aktywny",
  INACTIVE: "Nieaktywny",
  SUSPENDED: "Zawieszony",
};

interface ClientFormState {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date: string;
  skill_level: SkillLevel;
  status: ClientStatus;
  notes: string;
}

const emptyClientForm: ClientFormState = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  birth_date: "",
  skill_level: "BEGINNER",
  status: "ACTIVE",
  notes: "",
};

interface InstructorFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

const emptyInstructorForm: InstructorFormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
};

export function UsersPanel() {
  // --- CLIENTS STATE ---
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientsSuccess, setClientsSuccess] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] =
    useState<ClientFormState>(emptyClientForm);
  const [savingClient, setSavingClient] = useState(false);

  // --- INSTRUCTORS STATE ---
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructorsError, setInstructorsError] = useState<string | null>(null);
  const [instructorsSuccess, setInstructorsSuccess] = useState<string | null>(
    null
  );

  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(
    null
  );
  const [instructorForm, setInstructorForm] =
    useState<InstructorFormState>(emptyInstructorForm);
  const [savingInstructor, setSavingInstructor] = useState(false);

  async function reloadClients() {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (err) {
      setClientsError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać listy klientów."
      );
    }
  }

  async function reloadInstructors() {
    try {
      const data = await api.getInstructors();
      setInstructors(data);
    } catch (err) {
      setInstructorsError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać listy instruktorów."
      );
    }
  }

  useEffect(() => {
    let active = true;

    api
      .getClients()
      .then((data) => {
        if (active) {
          setClients(data);
          setClientsError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setClientsError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać listy klientów."
          );
        }
      })
      .finally(() => {
        if (active) setClientsLoading(false);
      });

    api
      .getInstructors()
      .then((data) => {
        if (active) {
          setInstructors(data);
          setInstructorsError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setInstructorsError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać listy instruktorów."
          );
        }
      })
      .finally(() => {
        if (active) setInstructorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // --- CLIENT HANDLERS ---

  function openAddClient() {
    setEditingClientId(null);
    setClientForm(emptyClientForm);
    setShowClientForm(true);
    setClientsError(null);
    setClientsSuccess(null);
  }

  function openEditClient(client: ClientItem) {
    setEditingClientId(client.id);
    setClientForm({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      email: client.email ?? "",
      birth_date: client.birth_date ?? "",
      skill_level: client.skill_level,
      status: client.status,
      notes: client.notes ?? "",
    });
    setShowClientForm(true);
    setClientsError(null);
    setClientsSuccess(null);
  }

  function closeClientForm() {
    setShowClientForm(false);
    setEditingClientId(null);
    setClientForm(emptyClientForm);
  }

  async function handleClientSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !clientForm.first_name.trim() ||
      !clientForm.last_name.trim() ||
      !clientForm.phone.trim()
    ) {
      setClientsError("Imię, nazwisko i telefon klienta są wymagane.");
      return;
    }

    try {
      setSavingClient(true);
      setClientsError(null);
      setClientsSuccess(null);

      const payload = {
        first_name: clientForm.first_name.trim(),
        last_name: clientForm.last_name.trim(),
        phone: clientForm.phone.trim(),
        email: clientForm.email.trim() || null,
        birth_date: clientForm.birth_date || null,
        skill_level: clientForm.skill_level,
        status: clientForm.status,
        notes: clientForm.notes.trim() || null,
      };

      if (editingClientId) {
        await api.updateClient(editingClientId, payload);
        setClientsSuccess("Zaktualizowano dane klienta.");
      } else {
        await api.createClient(payload);
        setClientsSuccess("Dodano nowego klienta do bazy danych.");
      }

      closeClientForm();
      await reloadClients();
    } catch (err) {
      setClientsError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać danych klienta."
      );
    } finally {
      setSavingClient(false);
    }
  }

  async function handleDeleteClient(client: ClientItem) {
    if (
      !window.confirm(
        `Czy na pewno chcesz usunąć klienta ${client.first_name} ${client.last_name}? Usunięte zostaną również jego karnety, umowy i rezerwacje.`
      )
    ) {
      return;
    }

    try {
      setClientsError(null);
      setClientsSuccess(null);
      await api.deleteClient(client.id);
      if (expandedClientId === client.id) setExpandedClientId(null);
      if (editingClientId === client.id) closeClientForm();
      setClientsSuccess("Usunięto klienta.");
      await reloadClients();
    } catch (err) {
      setClientsError(
        err instanceof Error ? err.message : "Nie udało się usunąć klienta."
      );
    }
  }

  // --- INSTRUCTOR HANDLERS ---

  function openAddInstructor() {
    setEditingInstructorId(null);
    setInstructorForm(emptyInstructorForm);
    setShowInstructorForm(true);
    setInstructorsError(null);
    setInstructorsSuccess(null);
  }

  function openEditInstructor(inst: InstructorItem) {
    setEditingInstructorId(inst.id);
    setInstructorForm({
      first_name: inst.first_name,
      last_name: inst.last_name,
      email: inst.email,
      phone: inst.phone,
      password: "",
    });
    setShowInstructorForm(true);
    setInstructorsError(null);
    setInstructorsSuccess(null);
  }

  function closeInstructorForm() {
    setShowInstructorForm(false);
    setEditingInstructorId(null);
    setInstructorForm(emptyInstructorForm);
  }

  async function handleInstructorSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !instructorForm.first_name.trim() ||
      !instructorForm.last_name.trim() ||
      !instructorForm.email.trim() ||
      !instructorForm.phone.trim()
    ) {
      setInstructorsError(
        "Imię, nazwisko, e-mail i telefon instruktora są wymagane."
      );
      return;
    }

    try {
      setSavingInstructor(true);
      setInstructorsError(null);
      setInstructorsSuccess(null);

      if (editingInstructorId) {
        await api.updateInstructor(editingInstructorId, {
          first_name: instructorForm.first_name.trim(),
          last_name: instructorForm.last_name.trim(),
          email: instructorForm.email.trim(),
          phone: instructorForm.phone.trim(),
          password: instructorForm.password.trim() || undefined,
        });
        setInstructorsSuccess("Zaktualizowano dane instruktora.");
      } else {
        await api.createInstructor({
          first_name: instructorForm.first_name.trim(),
          last_name: instructorForm.last_name.trim(),
          email: instructorForm.email.trim(),
          phone: instructorForm.phone.trim(),
          password: instructorForm.password.trim() || "demo_hash_inst",
        });
        setInstructorsSuccess("Dodano nowego instruktora do bazy danych.");
      }

      closeInstructorForm();
      await reloadInstructors();
    } catch (err) {
      setInstructorsError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać danych instruktora."
      );
    } finally {
      setSavingInstructor(false);
    }
  }

  async function handleDeleteInstructor(inst: InstructorItem) {
    if (
      !window.confirm(
        `Czy na pewno chcesz usunąć instruktora ${inst.first_name} ${inst.last_name}?`
      )
    ) {
      return;
    }

    try {
      setInstructorsError(null);
      setInstructorsSuccess(null);
      await api.deleteInstructor(inst.id);
      if (editingInstructorId === inst.id) closeInstructorForm();
      setInstructorsSuccess("Usunięto instruktora.");
      await reloadInstructors();
    } catch (err) {
      setInstructorsError(
        err instanceof Error
          ? err.message
          : "Nie udało się usunąć instruktora."
      );
    }
  }

  return (
    <div className="panel-stack">
      {/* SEKCJA 1: KLIENCI */}
      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Klienci (kursanci)</h3>
            <p className="panel-muted">
              Kliknij wybrany wiersz klienta, aby rozwinąć zarządzanie jego{" "}
              <strong>karnetami</strong> i <strong>umowami</strong>.
            </p>
          </div>
          <div className="header-actions">
            <span className="count-pill">{clients.length} klientów</span>
            <button
              type="button"
              className="primary-action small-btn"
              onClick={showClientForm && !editingClientId ? closeClientForm : openAddClient}
            >
              {showClientForm && !editingClientId ? "Zamknij" : "+ Dodaj klienta"}
            </button>
          </div>
        </div>

        {showClientForm && (
          <form className="panel-form sub-form-box" onSubmit={handleClientSubmit}>
            <h4>{editingClientId ? "Edytuj klienta" : "Nowy klient"}</h4>
            <div className="form-grid">
              <label className="form-field">
                <span>Imię *</span>
                <input
                  type="text"
                  value={clientForm.first_name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, first_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>Nazwisko *</span>
                <input
                  type="text"
                  value={clientForm.last_name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, last_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>Telefon *</span>
                <input
                  type="text"
                  value={clientForm.phone}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, phone: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>Data urodzenia</span>
                <input
                  type="date"
                  value={clientForm.birth_date}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, birth_date: e.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>Poziom</span>
                <select
                  value={clientForm.skill_level}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      skill_level: e.target.value as SkillLevel,
                    })
                  }
                >
                  {Object.entries(skillLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={clientForm.status}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      status: e.target.value as ClientStatus,
                    })
                  }
                >
                  {Object.entries(clientStatusLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Uwagi</span>
                <input
                  type="text"
                  value={clientForm.notes}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, notes: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="action-row">
              <button
                type="submit"
                className="primary-action small-btn"
                disabled={savingClient}
              >
                {savingClient
                  ? "Zapisywanie..."
                  : editingClientId
                    ? "Zapisz zmiany"
                    : "Dodaj klienta"}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={closeClientForm}
              >
                Anuluj
              </button>
            </div>
          </form>
        )}

        {clientsError && <p className="panel-error">{clientsError}</p>}
        {clientsSuccess && <p className="panel-success">{clientsSuccess}</p>}

        {clientsLoading ? (
          <p className="panel-muted">Ładowanie listy klientów...</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Klient</th>
                  <th>Kontakt</th>
                  <th>Data ur.</th>
                  <th>Poziom</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      Brak klientów w bazie danych.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const isExpanded = expandedClientId === client.id;
                    return (
                      <Fragment key={client.id}>
                        <tr
                          className={`clickable-row ${isExpanded ? "expanded" : ""}`}
                          onClick={() =>
                            setExpandedClientId(isExpanded ? null : client.id)
                          }
                          title="Kliknij, aby zarządzać umowami i karnetami"
                        >
                          <td>
                            <div className="expandable-name">
                              <span className="expand-chevron">
                                {isExpanded ? "▾" : "▸"}
                              </span>
                              <strong>
                                {client.first_name} {client.last_name}
                              </strong>
                            </div>
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
                                  : client.status === "SUSPENDED"
                                    ? "badge-danger"
                                    : "badge-warn"
                              }`}
                            >
                              {clientStatusLabels[client.status]}
                            </span>
                          </td>
                          <td>
                            <div
                              className="action-row"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="secondary-action"
                                onClick={() =>
                                  setExpandedClientId(
                                    isExpanded ? null : client.id
                                  )
                                }
                              >
                                {isExpanded ? "Zwiń" : "Umowa / Karnet"}
                              </button>
                              <button
                                type="button"
                                className="secondary-action"
                                onClick={() => openEditClient(client)}
                              >
                                Edytuj
                              </button>
                              <button
                                type="button"
                                className="danger-action"
                                onClick={() => handleDeleteClient(client)}
                              >
                                Usuń
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="expanded-detail-row">
                            <td colSpan={6}>
                              <ClientDetailsDrawer client={client} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SEKCJA 2: INSTRUKTORZY */}
      <section className="panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Instruktorzy</h3>
            <p className="panel-muted">
              Zarządzanie kontami instruktorów w tabelach <code>users</code> i{" "}
              <code>instructors</code>.
            </p>
          </div>
          <div className="header-actions">
            <span className="count-pill">{instructors.length} instruktorów</span>
            <button
              type="button"
              className="primary-action small-btn"
              onClick={
                showInstructorForm && !editingInstructorId
                  ? closeInstructorForm
                  : openAddInstructor
              }
            >
              {showInstructorForm && !editingInstructorId
                ? "Zamknij"
                : "+ Dodaj instruktora"}
            </button>
          </div>
        </div>

        {showInstructorForm && (
          <form
            className="panel-form sub-form-box"
            onSubmit={handleInstructorSubmit}
          >
            <h4>
              {editingInstructorId ? "Edytuj instruktora" : "Nowy instruktor"}
            </h4>
            <div className="form-grid">
              <label className="form-field">
                <span>Imię *</span>
                <input
                  type="text"
                  value={instructorForm.first_name}
                  onChange={(e) =>
                    setInstructorForm({
                      ...instructorForm,
                      first_name: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>Nazwisko *</span>
                <input
                  type="text"
                  value={instructorForm.last_name}
                  onChange={(e) =>
                    setInstructorForm({
                      ...instructorForm,
                      last_name: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>E-mail *</span>
                <input
                  type="email"
                  value={instructorForm.email}
                  onChange={(e) =>
                    setInstructorForm({
                      ...instructorForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>Telefon *</span>
                <input
                  type="text"
                  value={instructorForm.phone}
                  onChange={(e) =>
                    setInstructorForm({
                      ...instructorForm,
                      phone: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="form-field">
                <span>
                  {editingInstructorId
                    ? "Nowe hasło (opcjonalnie)"
                    : "Hasło startowe"}
                </span>
                <input
                  type="text"
                  value={instructorForm.password}
                  onChange={(e) =>
                    setInstructorForm({
                      ...instructorForm,
                      password: e.target.value,
                    })
                  }
                  placeholder={
                    editingInstructorId
                      ? "Zostaw puste, aby nie zmieniać"
                      : "domyślnie: demo_hash_inst"
                  }
                />
              </label>
            </div>
            <div className="action-row">
              <button
                type="submit"
                className="primary-action small-btn"
                disabled={savingInstructor}
              >
                {savingInstructor
                  ? "Zapisywanie..."
                  : editingInstructorId
                    ? "Zapisz zmiany"
                    : "Dodaj instruktora"}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={closeInstructorForm}
              >
                Anuluj
              </button>
            </div>
          </form>
        )}

        {instructorsError && <p className="panel-error">{instructorsError}</p>}
        {instructorsSuccess && (
          <p className="panel-success">{instructorsSuccess}</p>
        )}

        {instructorsLoading ? (
          <p className="panel-muted">Ładowanie listy instruktorów...</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>E-mail</th>
                  <th>Telefon</th>
                  <th>Akcje</th>
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
                        <div className="action-row">
                          <button
                            type="button"
                            className="secondary-action"
                            onClick={() => openEditInstructor(inst)}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="danger-action"
                            onClick={() => handleDeleteInstructor(inst)}
                          >
                            Usuń
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
