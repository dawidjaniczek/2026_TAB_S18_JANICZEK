import type {
  AuthUser,
  BookingCreatePayload,
  BookingItem,
  ClientCreatePayload,
  ClientItem,
  FacilityItem,
  GroupItem,
  InstructorItem,
  PassItem,
  SessionCreatePayload,
  SessionItem,
} from "../types/api";

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

  createClient: (payload: ClientCreatePayload) =>
    request<ClientItem>("/api/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getFacilities: () => request<FacilityItem[]>("/api/facilities"),

  getInstructors: () => request<InstructorItem[]>("/api/instructors"),

  getGroups: () => request<GroupItem[]>("/api/groups"),

  getSessions: () => request<SessionItem[]>("/api/sessions"),

  createSession: (payload: SessionCreatePayload) =>
    request<SessionItem>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getClientPasses: (clientId: string) =>
    request<PassItem[]>(`/api/clients/${clientId}/passes`),

  getBookings: () => request<BookingItem[]>("/api/bookings"),

  createBooking: (payload: BookingCreatePayload) =>
    request<{ id: string }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  markAttended: (bookingId: string) =>
    request<{ booking_id: string; status: string }>(
      `/api/bookings/${bookingId}/attend`,
      { method: "PATCH" }
    ),
};
