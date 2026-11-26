import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { BookingItem } from "../types/api";

export function BookingsTable() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reloadBookings() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .getBookings()
      .then((data) => {
        if (active) {
          setBookings(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Błąd pobierania danych"
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

  async function handleAttend(bookingId: string) {
    try {
      await api.markAttended(bookingId);
      await reloadBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się zapisać obecności");
    }
  }

  if (loading) return <p className="panel-muted">Ładowanie rezerwacji...</p>;
  if (error) return <p className="panel-error">{error}</p>;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Kursant</th>
            <th>Termin</th>
            <th>Rodzaj zajęć</th>
            <th>Karnet</th>
            <th>Status</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">
                Brak rezerwacji w bazie danych.
              </td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.client_name}</strong>
                </td>
                <td>{new Date(b.start_time).toLocaleString("pl-PL")}</td>
                <td>{b.lesson_type}</td>
                <td>{b.pass_counter}</td>
                <td>
                  <span
                    className={`status-badge ${
                      b.status === "ATTENDED"
                        ? "badge-active"
                        : b.status === "BOOKED"
                          ? "badge-info"
                          : "badge-warn"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td>
                  {b.status === "BOOKED" ? (
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => handleAttend(b.id)}
                    >
                      Potwierdź obecność
                    </button>
                  ) : (
                    <span className="panel-muted">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
