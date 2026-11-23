import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { BookingItem } from "../types/api";

export function BookingsTable() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBookings() {
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
    loadBookings();
  }, []);

  async function handleAttend(bookingId: string) {
    try {
      await api.markAttended(bookingId);
      await loadBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się zapisać obecności");
    }
  }

  if (loading) return <p>Ładowanie rezerwacji...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <table>
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
        {bookings.map((b) => (
          <tr key={b.id}>
            <td>{b.client_name}</td>
            <td>{new Date(b.start_time).toLocaleString("pl-PL")}</td>
            <td>{b.lesson_type}</td>
            <td>{b.pass_counter}</td>
            <td>{b.status}</td>
            <td>
              {b.status === "BOOKED" && (
                <button onClick={() => handleAttend(b.id)}>
                  Potwierdź obecność
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}