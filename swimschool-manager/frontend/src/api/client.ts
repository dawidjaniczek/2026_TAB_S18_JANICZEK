import type { AuthUser, BookingItem, ClientItem, SessionItem } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail ?? `Błąd API (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getClients: () => request<ClientItem[]>("/api/clients"),

  getSessions: () => request<SessionItem[]>("/api/sessions"),

  getBookings: () => request<BookingItem[]>("/api/bookings"),

  markAttended: (bookingId: string) =>
    request<{ booking_id: string; status: string }>(
      `/api/bookings/${bookingId}/attend`,
      { method: "PATCH" }
    ),
};