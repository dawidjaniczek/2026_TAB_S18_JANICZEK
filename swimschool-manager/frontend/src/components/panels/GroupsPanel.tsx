import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { GroupItem } from "../../types/api";

const skillLabels: Record<string, string> = {
  BEGINNER: "Początkujący",
  INTERMEDIATE: "Średniozaawansowany",
  ADVANCED: "Zaawansowany",
};

interface GroupsPanelProps {
  heading?: string;
}

export function GroupsPanel({ heading = "Grupy pływackie" }: GroupsPanelProps) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getGroups();
        if (active) setGroups(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się pobrać grup pływackich."
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
    <div className="panel-card">
      <div className="panel-card-header">
        <div>
          <h3>{heading}</h3>
          <p className="panel-muted">
            Aktualna lista grup z tabeli <code>swim_groups</code>.
          </p>
        </div>
        <span className="count-pill">{groups.length} grup</span>
      </div>

      {loading && <p className="panel-muted">Ładowanie grup...</p>}
      {error && <p className="panel-error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nazwa grupy</th>
                <th>Poziom docelowy</th>
                <th>Wiek uczestników</th>
                <th>Limit miejsc</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    Brak zdefiniowanych grup pływackich.
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <strong>{group.name}</strong>
                    </td>
                    <td>
                      <span className="status-badge badge-info">
                        {group.target_skill_level
                          ? (skillLabels[group.target_skill_level] ??
                            group.target_skill_level)
                          : "Dowolny"}
                      </span>
                    </td>
                    <td>
                      {group.min_age != null && group.max_age != null
                        ? `${group.min_age}–${group.max_age} lat`
                        : "Bez limitu"}
                    </td>
                    <td>{group.max_participants ?? "—"}</td>
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
