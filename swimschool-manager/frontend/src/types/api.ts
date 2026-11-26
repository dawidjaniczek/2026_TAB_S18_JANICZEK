export type UserRole = "ADMIN" | "RECEPTION" | "INSTRUCTOR" | "USER";

export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type ClientStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type LessonType =
  | "INDIVIDUAL"
  | "SEMI_INDIVIDUAL"
  | "GROUP"
  | "AQUAAEROBICS"
  | "SPECIAL_EVENT";

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
  skill_level: SkillLevel;
  status: ClientStatus;
  notes: string | null;
}

export interface ClientCreatePayload {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  birth_date?: string | null;
  skill_level: SkillLevel;
  notes?: string | null;
}

export interface FacilityItem {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

export interface InstructorItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface GroupItem {
  id: string;
  name: string;
  target_skill_level: SkillLevel | null;
  min_age: number | null;
  max_age: number | null;
  max_participants: number | null;
}

export interface SessionItem {
  id: string;
  start_time: string;
  duration_minutes: number;
  type: LessonType | string;
  is_cancelled: boolean;
  facility_name: string;
  instructor_name: string;
  group_name: string | null;
}

export interface SessionCreatePayload {
  instructor_id: string;
  facility_id: string;
  swim_group_id?: string | null;
  start_time: string;
  duration_minutes: number;
  type: LessonType;
}

export interface PassItem {
  id: string;
  total_lessons: number;
  used_lessons: number;
  counter: string;
  valid_from: string;
  valid_until: string;
  status: "ACTIVE" | "FROZEN" | "EXPIRED" | "FINISHED" | string;
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

export interface BookingCreatePayload {
  client_id: string;
  lesson_session_id: string;
  pass_id?: string | null;
}
