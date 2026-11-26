import type {
  AuthUser,
  BookingCreatePayload,
  BookingItem,
  ClientCreatePayload,
  ClientItem,
  ClientUpdatePayload,
  ContractCreatePayload,
  ContractItem,
  ContractUpdatePayload,
  FacilityItem,
  GroupItem,
  InstructorCreatePayload,
  InstructorItem,
  InstructorUpdatePayload,
  PassCreatePayload,
  PassItem,
  PassUpdatePayload,
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

  updateClient: (clientId: string, payload: ClientUpdatePayload) =>
    request<ClientItem>(`/api/clients/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteClient: (clientId: string) =>
    request<{ deleted: boolean; id: string }>(`/api/clients/${clientId}`, {
      method: "DELETE",
    }),

  getFacilities: () => request<FacilityItem[]>("/api/facilities"),

  getInstructors: () => request<InstructorItem[]>("/api/instructors"),

  createInstructor: (payload: InstructorCreatePayload) =>
    request<InstructorItem>("/api/instructors", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateInstructor: (instructorId: string, payload: InstructorUpdatePayload) =>
    request<InstructorItem>(`/api/instructors/${instructorId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteInstructor: (instructorId: string) =>
    request<{ deleted: boolean; id: string }>(
      `/api/instructors/${instructorId}`,
      {
        method: "DELETE",
      }
    ),

  getGroups: () => request<GroupItem[]>("/api/groups"),

  getSessions: () => request<SessionItem[]>("/api/sessions"),

  createSession: (payload: SessionCreatePayload) =>
    request<SessionItem>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getClientPasses: (clientId: string) =>
    request<PassItem[]>(`/api/clients/${clientId}/passes`),

  createClientPass: (clientId: string, payload: PassCreatePayload) =>
    request<PassItem>(`/api/clients/${clientId}/passes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePass: (passId: string, payload: PassUpdatePayload) =>
    request<PassItem>(`/api/passes/${passId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deletePass: (passId: string) =>
    request<{ deleted: boolean; id: string }>(`/api/passes/${passId}`, {
      method: "DELETE",
    }),

  getClientContracts: (clientId: string) =>
    request<ContractItem[]>(`/api/clients/${clientId}/contracts`),

  createClientContract: (clientId: string, payload: ContractCreatePayload) =>
    request<ContractItem>(`/api/clients/${clientId}/contracts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateContract: (contractId: string, payload: ContractUpdatePayload) =>
    request<ContractItem>(`/api/contracts/${contractId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteContract: (contractId: string) =>
    request<{ deleted: boolean; id: string }>(`/api/contracts/${contractId}`, {
      method: "DELETE",
    }),

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
