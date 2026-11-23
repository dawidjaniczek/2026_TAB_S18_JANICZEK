CREATE TYPE "staff_role" AS ENUM (
  'ADMIN',
  'RECEPTION'
);

CREATE TYPE "client_status" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
);

CREATE TYPE "skill_level" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED'
);

CREATE TYPE "instructor_skill_category" AS ENUM (
  'CERTIFICATION',
  'LIFEGUARDIAN'
);

CREATE TYPE "lesson_type" AS ENUM (
  'INDIVIDUAL',
  'SEMI_INDIVIDUAL',
  'GROUP',
  'AQUAAEROBICS',
  'SPECIAL_EVENT'
);

CREATE TYPE "pass_status" AS ENUM (
  'ACTIVE',
  'FROZEN',
  'EXPIRED',
  'FINISHED'
);

CREATE TYPE "booking_status" AS ENUM (
  'BOOKED',
  'ATTENDED',
  'CANCELLED_ON_TIME',
  'NO_SHOW',
  'RESCHEDULED'
);

CREATE TYPE "membership_status" AS ENUM (
  'WAITLISTED',
  'ACTIVE',
  'RESIGNED',
  'COMPLETED'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar UNIQUE NOT NULL,
  "password_hash" varchar NOT NULL,
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "phone" varchar NOT NULL
);

CREATE TABLE "staff_members" (
  "id" uuid PRIMARY KEY,
  "staff_role" staff_role NOT NULL
);

CREATE TABLE "instructors" (
  "id" uuid PRIMARY KEY
);

CREATE TABLE "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "email" varchar,
  "phone" varchar NOT NULL,
  "birth_date" date,
  "skill_level" skill_level NOT NULL DEFAULT 'BEGINNER',
  "status" client_status NOT NULL DEFAULT 'ACTIVE',
  "notes" text
);

CREATE TABLE "guardians" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "phone" varchar,
  "email" varchar
);

CREATE TABLE "client_guardians" (
  "client_id" uuid NOT NULL,
  "guardians_id" uuid NOT NULL,
  PRIMARY KEY ("client_id", "guardians_id")
);

CREATE TABLE "instructor_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar UNIQUE NOT NULL,
  "name" varchar NOT NULL,
  "category" instructor_skill_category NOT NULL,
  "description" text
);

CREATE TABLE "instructor_qualifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instructor_id" uuid NOT NULL,
  "instructor_skill_id" uuid NOT NULL,
  "lesson_type" lesson_type NOT NULL,
  "skill_level" skill_level NOT NULL,
  "valid_from" date,
  "valid_until" date,
  CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" >= "valid_from")
);

CREATE TABLE "instructor_availabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instructor_id" uuid NOT NULL,
  "date" date NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "is_available" boolean NOT NULL DEFAULT TRUE,
  CHECK ("end_time" > "start_time")
);

CREATE TABLE "facilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar NOT NULL,
  "address" varchar,
  "city" varchar
);

CREATE TABLE "swim_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar NOT NULL,
  "target_skill_level" skill_level,
  "min_age" int CHECK ("min_age" > 0),
  "max_age" int CHECK ("max_age" >= "min_age"),
  "max_participants" int CHECK ("max_participants" > 0)
);

CREATE TABLE "instructor_swim_groups" (
  "instructor_id" uuid NOT NULL,
  "swim_group_id" uuid NOT NULL,
  PRIMARY KEY ("instructor_id", "swim_group_id")
);

CREATE TABLE "group_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "swim_group_id" uuid NOT NULL,
  "joined_at" date NOT NULL DEFAULT CURRENT_DATE,
  "left_at" date,
  "status" membership_status NOT NULL DEFAULT 'ACTIVE',
  CHECK ("left_at" IS NULL OR "left_at" >= "joined_at")
);

CREATE TABLE "lesson_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instructor_id" uuid NOT NULL,
  "facility_id" uuid NOT NULL,
  "swim_group_id" uuid,
  "instructor_availability_id" uuid,
  "start_time" timestamp NOT NULL,
  "duration_minutes" smallint NOT NULL DEFAULT 45 CHECK ("duration_minutes" > 0),
  "type" lesson_type NOT NULL,
  "is_cancelled" boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE "passes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "total_lessons" int NOT NULL CHECK ("total_lessons" > 0),
  "used_lessons" int NOT NULL DEFAULT 0 CHECK ("used_lessons" >= 0 AND "used_lessons" <= "total_lessons"),
  "valid_from" date NOT NULL,
  "valid_until" date NOT NULL,
  "status" pass_status NOT NULL DEFAULT 'ACTIVE',
  CHECK ("valid_until" >= "valid_from")
);

CREATE TABLE "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "lesson_session_id" uuid NOT NULL,
  "pass_id" uuid,
  "booked_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" booking_status NOT NULL DEFAULT 'BOOKED',
  UNIQUE ("client_id", "lesson_session_id")
);

CREATE TABLE "contract_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "guardian_id" uuid,
  "title" varchar NOT NULL,
  "template_url" varchar,
  "signed_file_url" varchar,
  "is_signed" boolean NOT NULL DEFAULT FALSE,
  "generated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "staff_members" ADD FOREIGN KEY ("id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "instructors" ADD FOREIGN KEY ("id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "client_guardians" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "client_guardians" ADD FOREIGN KEY ("guardians_id") REFERENCES "guardians" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "instructor_qualifications" ADD FOREIGN KEY ("instructor_id") REFERENCES "instructors" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "instructor_qualifications" ADD FOREIGN KEY ("instructor_skill_id") REFERENCES "instructor_skills" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "instructor_availabilities" ADD FOREIGN KEY ("instructor_id") REFERENCES "instructors" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "instructor_swim_groups" ADD FOREIGN KEY ("instructor_id") REFERENCES "instructors" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "instructor_swim_groups" ADD FOREIGN KEY ("swim_group_id") REFERENCES "swim_groups" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "group_memberships" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "group_memberships" ADD FOREIGN KEY ("swim_group_id") REFERENCES "swim_groups" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lesson_sessions" ADD FOREIGN KEY ("instructor_id") REFERENCES "instructors" ("id") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "lesson_sessions" ADD FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "lesson_sessions" ADD FOREIGN KEY ("swim_group_id") REFERENCES "swim_groups" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "lesson_sessions" ADD FOREIGN KEY ("instructor_availability_id") REFERENCES "instructor_availabilities" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "passes" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "bookings" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "bookings" ADD FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "bookings" ADD FOREIGN KEY ("pass_id") REFERENCES "passes" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "contract_documents" ADD FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "contract_documents" ADD FOREIGN KEY ("guardian_id") REFERENCES "guardians" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;