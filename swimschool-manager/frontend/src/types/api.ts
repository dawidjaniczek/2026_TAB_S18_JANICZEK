export type UserRole = "ADMIN" | "RECEPTION" | "INSTRUCTOR" | "USER";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface ClientItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  birth_date: string | null;
  skill_level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  notes: string | null;
}

export interface SessionItem {
  id: string;
  start_time: string;
  duration_minutes: number;
  type: string;
  is_cancelled: boolean;
  facility_name: string;
  instructor_name: string;
  group_name: string | null;
}

export interface BookingItem {
  id: string;
  status: string;
  booked_at: string;
  client_name: string;
  start_time: string;
  lesson_type: string;
  pass_counter: string;
}