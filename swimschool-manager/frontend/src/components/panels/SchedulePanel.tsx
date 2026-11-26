import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type {
  FacilityItem,
  GroupItem,
  InstructorItem,
  LessonType,
  SessionItem,
} from "../../types/api";

const lessonTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Indywidualne",
  SEMI_INDIVIDUAL: "Półindywidualne",
  GROUP: "Grupowe",
  AQUAAEROBICS: "Aquaaerobik",
  SPECIAL_EVENT: "Wydarzenie specjalne",
};

interface SchedulePanelProps {
  canCreate?: boolean;
  instructorFullName?: string;
}

export function SchedulePanel({
  canCreate = false,
  instructorFullName,
}: SchedulePanelProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [onlyMine, setOnlyMine] = useState(Boolean(instructorFullName));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [instructorId, setInstructorId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [lessonType, setLessonType] = useState<LessonType>("GROUP");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, facilitiesData, instructorsData, groupsData] =
        await Promise.all([
          api.getSessions(),
          api.getFacilities(),
          api.getInstructors(),
          api.getGroups(),
        ]);
      setSessions(sessionsData);
      setFacilities(facilitiesData);
      setInstructors(instructorsData);
      setGroups(groupsData);

      if (!instructorId && instructorsData.length > 0) {
        setInstructorId(instructorsData[0].id);
      }
      if (!facilityId && facilitiesData.length > 0) {
        setFacilityId(facilitiesData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać harmonogramu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!instructorId || !facilityId || !startTime) {
      setFormError("Uzupełnij instruktora, obiekt oraz datę i godzinę.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      setFormSuccess(null);
      await api.createSession({
        instructor_id: instructorId,
        facility_id: facilityId,
        swim_group_id: groupId || null,
        start_time: startTime,
        duration_minutes: durationMinutes,
        type: lessonType,
      });
      setFormSuccess("Nowe zajęcia zostały dodane do harmonogramu.");
      setStartTime("");
      await loadAll();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Nie udało się utworzyć zajęć."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const visibleSessions =
    instructorFullName && onlyMine
      ? sessions.filter((s) => s.instructor_name === instructorFullName)
      : sessions;

  return (
    <div className="panel-stack">
      {canCreate && (
        <div className="panel-card">
          <h3>Dodaj zajęcia do harmonogramu</h3>
          <p className="panel-muted">
            Backend automatycznie sprawdza kolizje w grafiku instruktora.
          </p>

          <form className="panel-form" onSubmit={handleCreateSession}>
            <div className="form-grid">
              <label className="form-field">
                <span>Instruktor</span>
                <select
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  required
                >
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.first_name} {inst.last_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Obiekt</span>
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  required
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Rodzaj zajęć</span>
                <select
                  value={lessonType}
                  onChange={(e) => setLessonType(e.target.value as LessonType)}
                >
                  {Object.entries(lessonTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Grupa (opcjonalnie)</span>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">Brak (np. indywidualne)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Data i godzina rozpoczęcia</span>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Czas trwania (min)</span>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  required
                />
              </label>
            </div>

            {formError && <p className="panel-error">{formError}</p>}
            {formSuccess && <p className="panel-success">{formSuccess}</p>}

            <button
              type="submit"
              className="primary-action"
              disabled={submitting}
            >
              {submitting ? "Zapisywanie..." : "Dodaj zajęcia"}
            </button>
          </form>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Zaplanowane zajęcia</h3>
            <p className="panel-muted">
              Terminy pobrane z tabeli <code>lesson_sessions</code>.
            </p>
          </div>
          <div className="header-actions">
            {instructorFullName && (
              <button
                type="button"
                className="secondary-action"
                onClick={() => setOnlyMine((prev) => !prev)}
              >
                {onlyMine ? "Pokaż wszystkie zajęcia" : "Tylko moje zajęcia"}
              </button>
            )}
            <span className="count-pill">{visibleSessions.length} zajęć</span>
          </div>
        </div>

        {loading && <p className="panel-muted">Ładowanie harmonogramu...</p>}
        {error && <p className="panel-error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Termin</th>
                  <th>Czas</th>
                  <th>Typ</th>
                  <th>Instruktor</th>
                  <th>Obiekt</th>
                  <th>Grupa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      Brak zajęć do wyświetlenia.
                    </td>
                  </tr>
                ) : (
                  visibleSessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <strong>
                          {new Date(session.start_time).toLocaleString("pl-PL")}
                        </strong>
                      </td>
                      <td>{session.duration_minutes} min</td>
                      <td>
                        {lessonTypeLabels[session.type] ?? session.type}
                      </td>
                      <td>{session.instructor_name}</td>
                      <td>{session.facility_name}</td>
                      <td>{session.group_name ?? "Indywidualne"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            session.is_cancelled
                              ? "badge-danger"
                              : "badge-active"
                          }`}
                        >
                          {session.is_cancelled ? "Odwołane" : "Aktywne"}
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

      <div className="panel-card">
        <div className="panel-card-header">
          <div>
            <h3>Obiekty basenowe</h3>
            <p className="panel-muted">Dostępne pływalnie w bazie danych.</p>
          </div>
          <span className="count-pill">{facilities.length} obiektów</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Adres</th>
                <th>Miasto</th>
              </tr>
            </thead>
            <tbody>
              {facilities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    Brak obiektów w bazie danych.
                  </td>
                </tr>
              ) : (
                facilities.map((facility) => (
                  <tr key={facility.id}>
                    <td>
                      <strong>{facility.name}</strong>
                    </td>
                    <td>{facility.address ?? "—"}</td>
                    <td>{facility.city ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
