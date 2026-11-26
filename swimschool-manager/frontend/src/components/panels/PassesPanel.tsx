import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ClientItem, PassItem } from "../../types/api";

interface ClientPassRow {
  client: ClientItem;
  passes: PassItem[];
}

export function PassesPanel() {
  const [rows, setRows] = useState<ClientPassRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const clients = await api.getClients();
        const passLists = await Promise.all(
          clients.map(async (client) => ({
            client,
            passes: await api.getClientPasses(client.id),
          }))
        );
        if (active) setRows(passLists);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać danych o karnetach."
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

  const visibleRows =
    selectedClientId === "ALL"
      ? rows
      : rows.filter((r) => r.client.id === selectedClientId);

  const flattened = visibleRows.flatMap((r) =>
    r.passes.map((pass) => ({ client: r.client, pass }))
  );

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <div>
          <h3>Karnety kursantów</h3>
          <p className="panel-muted">
            Stan wykorzystania lekcji oraz terminy ważności karnetów.
          </p>
        </div>
        <div className="header-actions">
          <select
            className="inline-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            aria-label="Wybierz kursanta"
          >
            <option value="ALL">Wszyscy kursanci</option>
            {rows.map(({ client }) => (
              <option key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </option>
            ))}
          </select>
          <span className="count-pill">{flattened.length} karnetów</span>
        </div>
      </div>

      {loading && <p className="panel-muted">Ładowanie karnetów...</p>}
      {error && <p className="panel-error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kursant</th>
                <th>Wykorzystane wejścia</th>
                <th>Ważny od</th>
                <th>Ważny do</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {flattened.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    Brak karnetów dla wybranego filtra.
                  </td>
                </tr>
              ) : (
                flattened.map(({ client, pass }) => (
                  <tr key={pass.id}>
                    <td>
                      <strong>
                        {client.first_name} {client.last_name}
                      </strong>
                    </td>
                    <td>
                      <strong>{pass.counter}</strong>
                    </td>
                    <td>{pass.valid_from}</td>
                    <td>{pass.valid_until}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          pass.status === "ACTIVE"
                            ? "badge-active"
                            : pass.status === "FROZEN"
                              ? "badge-info"
                              : "badge-warn"
                        }`}
                      >
                        {pass.status}
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
  );
}
