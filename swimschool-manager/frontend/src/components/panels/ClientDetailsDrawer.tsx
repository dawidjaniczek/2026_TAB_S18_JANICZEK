import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type {
  ClientItem,
  ContractItem,
  PassItem,
  PassStatus,
} from "../../types/api";

interface ClientDetailsDrawerProps {
  client: ClientItem;
}

const passStatusLabels: Record<PassStatus, string> = {
  ACTIVE: "Aktywny",
  FROZEN: "Zamrożony",
  EXPIRED: "Anulowany / Wygasły",
  FINISHED: "Wykorzystany",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(baseDateISO: string, days: number): string {
  const [y, m, d] = baseDateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function ClientDetailsDrawer({ client }: ClientDetailsDrawerProps) {
  const [passes, setPasses] = useState<PassItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Add pass state
  const [showAddPass, setShowAddPass] = useState(false);
  const [newPassTotal, setNewPassTotal] = useState(8);
  const [newPassFrom, setNewPassFrom] = useState(todayISO);
  const [newPassUntil, setNewPassUntil] = useState(() =>
    addDaysISO(todayISO(), 30)
  );
  const [savingPass, setSavingPass] = useState(false);

  // Edit pass state
  const [editingPassId, setEditingPassId] = useState<string | null>(null);
  const [editPassTotal, setEditPassTotal] = useState(8);
  const [editPassUsed, setEditPassUsed] = useState(0);
  const [editPassFrom, setEditPassFrom] = useState("");
  const [editPassUntil, setEditPassUntil] = useState("");
  const [editPassStatus, setEditPassStatus] = useState<PassStatus>("ACTIVE");

  // Add contract state
  const [showAddContract, setShowAddContract] = useState(false);
  const [newContractTitle, setNewContractTitle] = useState("");
  const [newContractTemplate, setNewContractTemplate] = useState("");
  const [newContractSignedUrl, setNewContractSignedUrl] = useState("");
  const [newContractSigned, setNewContractSigned] = useState(false);
  const [savingContract, setSavingContract] = useState(false);

  // Edit contract state
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null
  );
  const [editContractTitle, setEditContractTitle] = useState("");
  const [editContractTemplate, setEditContractTemplate] = useState("");
  const [editContractSignedUrl, setEditContractSignedUrl] = useState("");
  const [editContractSigned, setEditContractSigned] = useState(false);

  async function reloadDetails() {
    try {
      setError(null);
      const [passesData, contractsData] = await Promise.all([
        api.getClientPasses(client.id),
        api.getClientContracts(client.id),
      ]);
      setPasses(passesData);
      setContracts(contractsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać umów i karnetów klienta."
      );
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getClientPasses(client.id),
      api.getClientContracts(client.id),
    ])
      .then(([passesData, contractsData]) => {
        if (active) {
          setPasses(passesData);
          setContracts(contractsData);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać umów i karnetów klienta."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client.id]);

  // --- PASS ACTIONS ---

  async function handleCreatePass(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSavingPass(true);
      setError(null);
      setFeedback(null);
      await api.createClientPass(client.id, {
        total_lessons: newPassTotal,
        valid_from: newPassFrom,
        valid_until: newPassUntil,
        status: "ACTIVE",
      });
      setShowAddPass(false);
      setFeedback("Dodano nowy karnet.");
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się dodać karnetu."
      );
    } finally {
      setSavingPass(false);
    }
  }

  async function handleQuickExtendPass(pass: PassItem, days: number) {
    try {
      setError(null);
      setFeedback(null);
      const nextUntil = addDaysISO(pass.valid_until, days);
      const nextStatus: PassStatus =
        pass.status === "EXPIRED" ? "ACTIVE" : pass.status;
      await api.updatePass(pass.id, {
        valid_until: nextUntil,
        status: nextStatus,
      });
      setFeedback(`Przedłużono karnet o ${days} dni (do ${nextUntil}).`);
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się przedłużyć karnetu."
      );
    }
  }

  async function handleSetPassStatus(pass: PassItem, status: PassStatus) {
    try {
      setError(null);
      setFeedback(null);
      await api.updatePass(pass.id, { status });
      setFeedback(`Zmieniono status karnetu na: ${passStatusLabels[status]}.`);
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zmienić statusu karnetu."
      );
    }
  }

  function startEditPass(pass: PassItem) {
    setEditingPassId(pass.id);
    setEditPassTotal(pass.total_lessons);
    setEditPassUsed(pass.used_lessons);
    setEditPassFrom(pass.valid_from);
    setEditPassUntil(pass.valid_until);
    setEditPassStatus(pass.status);
  }

  async function handleSavePassEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPassId) return;
    try {
      setSavingPass(true);
      setError(null);
      setFeedback(null);
      await api.updatePass(editingPassId, {
        total_lessons: editPassTotal,
        used_lessons: editPassUsed,
        valid_from: editPassFrom,
        valid_until: editPassUntil,
        status: editPassStatus,
      });
      setEditingPassId(null);
      setFeedback("Zapisano zmiany w karnecie.");
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zapisać karnetu."
      );
    } finally {
      setSavingPass(false);
    }
  }

  async function handleDeletePass(passId: string) {
    if (!window.confirm("Czy na pewno chcesz trwale usunąć ten karnet?")) {
      return;
    }
    try {
      setError(null);
      setFeedback(null);
      await api.deletePass(passId);
      if (editingPassId === passId) setEditingPassId(null);
      setFeedback("Usunięto karnet.");
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się usunąć karnetu."
      );
    }
  }

  // --- CONTRACT ACTIONS ---

  async function handleCreateContract(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newContractTitle.trim()) {
      setError("Podaj tytuł umowy.");
      return;
    }
    try {
      setSavingContract(true);
      setError(null);
      setFeedback(null);
      await api.createClientContract(client.id, {
        title: newContractTitle.trim(),
        template_url: newContractTemplate.trim() || null,
        signed_file_url: newContractSignedUrl.trim() || null,
        is_signed: newContractSigned,
      });
      setNewContractTitle("");
      setNewContractTemplate("");
      setNewContractSignedUrl("");
      setNewContractSigned(false);
      setShowAddContract(false);
      setFeedback("Dodano nową umowę.");
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się dodać umowy."
      );
    } finally {
      setSavingContract(false);
    }
  }

  async function handleToggleContractSigned(contract: ContractItem) {
    try {
      setError(null);
      setFeedback(null);
      await api.updateContract(contract.id, { is_signed: !contract.is_signed });
      setFeedback(
        contract.is_signed
          ? "Cofnięto status podpisania umowy."
          : "Oznaczono umowę jako podpisaną."
      );
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zaktualizować umowy."
      );
    }
  }

  function startEditContract(contract: ContractItem) {
    setEditingContractId(contract.id);
    setEditContractTitle(contract.title);
    setEditContractTemplate(contract.template_url ?? "");
    setEditContractSignedUrl(contract.signed_file_url ?? "");
    setEditContractSigned(contract.is_signed);
  }

  async function handleSaveContractEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingContractId) return;
    try {
      setSavingContract(true);
      setError(null);
      setFeedback(null);
      await api.updateContract(editingContractId, {
        title: editContractTitle.trim(),
        template_url: editContractTemplate.trim() || null,
        signed_file_url: editContractSignedUrl.trim() || null,
        is_signed: editContractSigned,
      });
      setEditingContractId(null);
      setFeedback("Zapisano zmiany w umowie.");
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zapisać umowy."
      );
    } finally {
      setSavingContract(false);
    }
  }

  async function handleDeleteContract(contractId: string) {
    if (!window.confirm("Czy na pewno chcesz anulować i usunąć tę umowę?")) {
      return;
    }
    try {
      setError(null);
      setFeedback(null);
      await api.deleteContract(contractId);
      if (editingContractId === contractId) setEditingContractId(null);
      setFeedback("Usunięto umowę.");
      await reloadDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się usunąć umowy."
      );
    }
  }

  if (loading) {
    return (
      <div className="client-drawer">
        <p className="panel-muted">Ładowanie umów i karnetów klienta...</p>
      </div>
    );
  }

  return (
    <div className="client-drawer">
      <div className="client-drawer-top">
        <div>
          <strong>
            Szczegóły klienta: {client.first_name} {client.last_name}
          </strong>
          {client.notes && (
            <p className="panel-muted" style={{ marginTop: 4, marginBottom: 0 }}>
              Uwagi: {client.notes}
            </p>
          )}
        </div>
      </div>

      {error && <p className="panel-error">{error}</p>}
      {feedback && <p className="panel-success">{feedback}</p>}

      <div className="drawer-columns">
        {/* KARNETY */}
        <section className="drawer-section">
          <div className="drawer-section-header">
            <h4>Karnety ({passes.length})</h4>
            <button
              type="button"
              className="secondary-action"
              onClick={() => setShowAddPass((prev) => !prev)}
            >
              {showAddPass ? "Zamknij" : "+ Dodaj karnet"}
            </button>
          </div>

          {showAddPass && (
            <form className="compact-form" onSubmit={handleCreatePass}>
              <div className="compact-form-grid">
                <label className="form-field">
                  <span>Liczba wejść</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={newPassTotal}
                    onChange={(e) => setNewPassTotal(Number(e.target.value))}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Ważny od</span>
                  <input
                    type="date"
                    value={newPassFrom}
                    onChange={(e) => setNewPassFrom(e.target.value)}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Ważny do</span>
                  <input
                    type="date"
                    value={newPassUntil}
                    onChange={(e) => setNewPassUntil(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="action-row">
                <button
                  type="submit"
                  className="primary-action small-btn"
                  disabled={savingPass}
                >
                  {savingPass ? "Zapisywanie..." : "Wystaw karnet"}
                </button>
              </div>
            </form>
          )}

          {passes.length === 0 ? (
            <p className="panel-muted">Ten klient nie ma jeszcze żadnego karnetu.</p>
          ) : (
            <div className="drawer-list">
              {passes.map((pass) => (
                <div key={pass.id} className="drawer-item-card">
                  {editingPassId === pass.id ? (
                    <form className="compact-form" onSubmit={handleSavePassEdit}>
                      <div className="compact-form-grid">
                        <label className="form-field">
                          <span>Wykorzystane</span>
                          <input
                            type="number"
                            min={0}
                            max={editPassTotal}
                            value={editPassUsed}
                            onChange={(e) =>
                              setEditPassUsed(Number(e.target.value))
                            }
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Łącznie wejść</span>
                          <input
                            type="number"
                            min={1}
                            max={200}
                            value={editPassTotal}
                            onChange={(e) =>
                              setEditPassTotal(Number(e.target.value))
                            }
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Ważny od</span>
                          <input
                            type="date"
                            value={editPassFrom}
                            onChange={(e) => setEditPassFrom(e.target.value)}
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Ważny do</span>
                          <input
                            type="date"
                            value={editPassUntil}
                            onChange={(e) => setEditPassUntil(e.target.value)}
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Status</span>
                          <select
                            value={editPassStatus}
                            onChange={(e) =>
                              setEditPassStatus(e.target.value as PassStatus)
                            }
                          >
                            {Object.entries(passStatusLabels).map(
                              ([val, label]) => (
                                <option key={val} value={val}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      </div>
                      <div className="action-row">
                        <button
                          type="submit"
                          className="primary-action small-btn"
                          disabled={savingPass}
                        >
                          Zapisz
                        </button>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => setEditingPassId(null)}
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="drawer-item-head">
                        <div>
                          <strong>Wejścia: {pass.counter}</strong>
                          <div className="sub-text">
                            Ważność: {pass.valid_from} – {pass.valid_until}
                          </div>
                        </div>
                        <span
                          className={`status-badge ${
                            pass.status === "ACTIVE"
                              ? "badge-active"
                              : pass.status === "FROZEN"
                                ? "badge-info"
                                : pass.status === "EXPIRED"
                                  ? "badge-danger"
                                  : "badge-warn"
                          }`}
                        >
                          {passStatusLabels[pass.status] ?? pass.status}
                        </span>
                      </div>

                      <div className="action-row">
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => handleQuickExtendPass(pass, 30)}
                        >
                          +30 dni
                        </button>
                        {pass.status === "FROZEN" ? (
                          <button
                            type="button"
                            className="secondary-action"
                            onClick={() => handleSetPassStatus(pass, "ACTIVE")}
                          >
                            Wznów
                          </button>
                        ) : (
                          pass.status === "ACTIVE" && (
                            <button
                              type="button"
                              className="secondary-action"
                              onClick={() =>
                                handleSetPassStatus(pass, "FROZEN")
                              }
                            >
                              Zamroź
                            </button>
                          )
                        )}
                        {pass.status !== "EXPIRED" && (
                          <button
                            type="button"
                            className="warn-action"
                            onClick={() => handleSetPassStatus(pass, "EXPIRED")}
                          >
                            Anuluj karnet
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => startEditPass(pass)}
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => handleDeletePass(pass.id)}
                        >
                          Usuń
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* UMOWY */}
        <section className="drawer-section">
          <div className="drawer-section-header">
            <h4>Umowy ({contracts.length})</h4>
            <button
              type="button"
              className="secondary-action"
              onClick={() => setShowAddContract((prev) => !prev)}
            >
              {showAddContract ? "Zamknij" : "+ Dodaj umowę"}
            </button>
          </div>

          {showAddContract && (
            <form className="compact-form" onSubmit={handleCreateContract}>
              <div className="compact-form-grid">
                <label className="form-field">
                  <span>Tytuł umowy *</span>
                  <input
                    type="text"
                    value={newContractTitle}
                    onChange={(e) => setNewContractTitle(e.target.value)}
                    placeholder="np. Umowa_Nauka_Plywania_2026.pdf"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Ścieżka szablonu</span>
                  <input
                    type="text"
                    value={newContractTemplate}
                    onChange={(e) => setNewContractTemplate(e.target.value)}
                    placeholder="/templates/umowa.pdf"
                  />
                </label>
                <label className="form-field">
                  <span>Plik podpisany</span>
                  <input
                    type="text"
                    value={newContractSignedUrl}
                    onChange={(e) => setNewContractSignedUrl(e.target.value)}
                    placeholder="/signed/klient.pdf"
                  />
                </label>
              </div>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={newContractSigned}
                  onChange={(e) => setNewContractSigned(e.target.checked)}
                />
                <span>Umowa podpisana</span>
              </label>
              <div className="action-row">
                <button
                  type="submit"
                  className="primary-action small-btn"
                  disabled={savingContract}
                >
                  {savingContract ? "Zapisywanie..." : "Dodaj umowę"}
                </button>
              </div>
            </form>
          )}

          {contracts.length === 0 ? (
            <p className="panel-muted">Brak przypisanych umów dla tego klienta.</p>
          ) : (
            <div className="drawer-list">
              {contracts.map((contract) => (
                <div key={contract.id} className="drawer-item-card">
                  {editingContractId === contract.id ? (
                    <form
                      className="compact-form"
                      onSubmit={handleSaveContractEdit}
                    >
                      <div className="compact-form-grid">
                        <label className="form-field">
                          <span>Tytuł umowy *</span>
                          <input
                            type="text"
                            value={editContractTitle}
                            onChange={(e) =>
                              setEditContractTitle(e.target.value)
                            }
                            required
                          />
                        </label>
                        <label className="form-field">
                          <span>Szablon</span>
                          <input
                            type="text"
                            value={editContractTemplate}
                            onChange={(e) =>
                              setEditContractTemplate(e.target.value)
                            }
                          />
                        </label>
                        <label className="form-field">
                          <span>Podpisany plik</span>
                          <input
                            type="text"
                            value={editContractSignedUrl}
                            onChange={(e) =>
                              setEditContractSignedUrl(e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={editContractSigned}
                          onChange={(e) =>
                            setEditContractSigned(e.target.checked)
                          }
                        />
                        <span>Umowa podpisana</span>
                      </label>
                      <div className="action-row">
                        <button
                          type="submit"
                          className="primary-action small-btn"
                          disabled={savingContract}
                        >
                          Zapisz
                        </button>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => setEditingContractId(null)}
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="drawer-item-head">
                        <div>
                          <strong>{contract.title}</strong>
                          <div className="sub-text">
                            Wygenerowano:{" "}
                            {new Date(contract.generated_at).toLocaleString(
                              "pl-PL"
                            )}
                          </div>
                          {contract.guardian_name && (
                            <div className="sub-text">
                              Opiekun: {contract.guardian_name}
                            </div>
                          )}
                          {contract.signed_file_url && (
                            <div className="sub-text">
                              Plik: <code>{contract.signed_file_url}</code>
                            </div>
                          )}
                        </div>
                        <span
                          className={`status-badge ${
                            contract.is_signed ? "badge-active" : "badge-warn"
                          }`}
                        >
                          {contract.is_signed ? "Podpisana" : "Niepodpisana"}
                        </span>
                      </div>

                      <div className="action-row">
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => handleToggleContractSigned(contract)}
                        >
                          {contract.is_signed
                            ? "Cofnij podpis"
                            : "Oznacz jako podpisaną"}
                        </button>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => startEditContract(contract)}
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => handleDeleteContract(contract.id)}
                        >
                          Anuluj / Usuń
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
