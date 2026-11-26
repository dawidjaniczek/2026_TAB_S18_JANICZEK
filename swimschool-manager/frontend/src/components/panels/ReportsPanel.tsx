import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type {
  BookingItem,
  ClientItem,
  FacilityItem,
  GroupItem,
  InstructorItem,
  SessionItem,
} from "../../types/api";

interface ReportData {
  clients: ClientItem[];
  groups: GroupItem[];
  sessions: SessionItem[];
  bookings: BookingItem[];
  instructors: InstructorItem[];
  facilities: FacilityItem[];
}

export function ReportsPanel() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [clients, groups, sessions, bookings, instructors, facilities] =
          await Promise.all([
            api.getClients(),
            api.getGroups(),
            api.getSessions(),
            api.getBookings(),
            api.getInstructors(),
            api.getFacilities(),
          ]);
        if (active) {
          setData({
            clients,
            groups,
            sessions,
            bookings,
            instructors,
            facilities,
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nie udało się wygenerować statystyk."
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

  if (loading) {
    return (
      <div className="panel-card">
        <p className="panel-muted">Obliczanie raportów z bazy PostgreSQL...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="panel-card">
        <p className="panel-error">{error ?? "Brak danych do raportu."}</p>
      </div>
    );
  }

  const activeClients = data.clients.filter((c) => c.status === "ACTIVE").length;
  const attendedBookings = data.bookings.filter(
    (b) => b.status === "ATTENDED"
  ).length;
  const attendanceRate =
    data.bookings.length > 0
      ? Math.round((attendedBookings / data.bookings.length) * 100)
      : 0;

  const bookingsByStatus = data.bookings.reduce<Record<string, number>>(
    (acc, booking) => {
      acc[booking.status] = (acc[booking.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const sessionsByInstructor = data.sessions.reduce<Record<string, number>>(
    (acc, session) => {
      acc[session.instructor_name] = (acc[session.instructor_name] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="panel-stack">
      <div className="stats-grid">
        <div className="stat-card">
          <span>Aktywni kursanci</span>
          <strong>
            {activeClients} / {data.clients.length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Grupy pływackie</span>
          <strong>{data.groups.length}</strong>
        </div>
        <div className="stat-card">
          <span>Zaplanowane zajęcia</span>
          <strong>{data.sessions.length}</strong>
        </div>
        <div className="stat-card">
          <span>Frekwencja (ATTENDED)</span>
          <strong>
            {attendanceRate}% ({attendedBookings}/{data.bookings.length})
          </strong>
        </div>
        <div className="stat-card">
          <span>Instruktorzy</span>
          <strong>{data.instructors.length}</strong>
        </div>
        <div className="stat-card">
          <span>Obiekty basenowe</span>
          <strong>{data.facilities.length}</strong>
        </div>
      </div>

      <div className="panel-two-col">
        <div className="panel-card">
          <h3>Rezerwacje według statusu</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Liczba</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(bookingsByStatus).map(([status, count]) => (
                  <tr key={status}>
                    <td>
                      <span className="status-badge badge-info">{status}</span>
                    </td>
                    <td>
                      <strong>{count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <h3>Obłożenie instruktorów (liczba zajęć)</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instruktor</th>
                  <th>Liczba zajęć</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sessionsByInstructor).map(([name, count]) => (
                  <tr key={name}>
                    <td>
                      <strong>{name}</strong>
                    </td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
