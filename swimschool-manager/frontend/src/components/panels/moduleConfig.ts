import type { UserRole } from "../../types/api";

export type ModuleId =
  | "users"
  | "groups"
  | "schedule"
  | "reports"
  | "clients"
  | "bookings"
  | "passes"
  | "contracts"
  | "my-groups"
  | "instructor-schedule"
  | "attendance"
  | "levels-notes"
  | "my-account"
  | "my-sessions"
  | "info";

export interface DashboardModule {
  id: ModuleId;
  slug: string;
  icon: string;
  title: string;
  description: string;
}

export const MODULES_BY_ROLE: Record<UserRole, DashboardModule[]> = {
  ADMIN: [
    {
      id: "users",
      slug: "uzytkownicy",
      icon: "♙",
      title: "Użytkownicy",
      description: "Zarządzaj kontami i uprawnieniami.",
    },
    {
      id: "groups",
      slug: "grupy",
      icon: "▦",
      title: "Grupy pływackie",
      description: "Zarządzaj grupami i przydziałami.",
    },
    {
      id: "schedule",
      slug: "harmonogram",
      icon: "◷",
      title: "Harmonogram",
      description: "Zarządzaj terminami zajęć.",
    },
    {
      id: "reports",
      slug: "raporty",
      icon: "▤",
      title: "Raporty",
      description: "Przeglądaj dane i statystyki.",
    },
  ],
  RECEPTION: [
    {
      id: "clients",
      slug: "kursanci",
      icon: "♙",
      title: "Kursanci",
      description: "Zarządzaj kartotekami i opiekunami.",
    },
    {
      id: "bookings",
      slug: "rezerwacje",
      icon: "◷",
      title: "Rezerwacje",
      description: "Obsługuj zapisy i odwołania zajęć.",
    },
    {
      id: "passes",
      slug: "karnety",
      icon: "▤",
      title: "Karnety",
      description: "Sprawdzaj ważność i liczniki lekcji.",
    },
    {
      id: "contracts",
      slug: "umowy",
      icon: "✓",
      title: "Umowy",
      description: "Zarządzaj dokumentami kursantów.",
    },
  ],
  INSTRUCTOR: [
    {
      id: "my-groups",
      slug: "moje-grupy",
      icon: "♙",
      title: "Moje grupy",
      description: "Przeglądaj przypisane grupy.",
    },
    {
      id: "instructor-schedule",
      slug: "harmonogram",
      icon: "◷",
      title: "Harmonogram",
      description: "Sprawdź swoje nadchodzące zajęcia.",
    },
    {
      id: "attendance",
      slug: "obecnosci",
      icon: "✓",
      title: "Obecności",
      description: "Zarządzaj obecnością uczestników.",
    },
    {
      id: "levels-notes",
      slug: "poziomy-i-uwagi",
      icon: "▤",
      title: "Poziomy i uwagi",
      description: "Przeglądaj poziom i notatki o kursantach.",
    },
  ],
  USER: [
    {
      id: "my-account",
      slug: "moje-konto",
      icon: "♙",
      title: "Moje konto",
      description: "Przeglądaj swoje dane.",
    },
    {
      id: "my-sessions",
      slug: "moje-zajecia",
      icon: "◷",
      title: "Moje zajęcia",
      description: "Sprawdź przypisane zajęcia.",
    },
    {
      id: "info",
      slug: "informacje",
      icon: "▤",
      title: "Informacje",
      description: "Sprawdź komunikaty szkółki.",
    },
  ],
};

export function getModuleFromPath(
  pathname: string,
  role: UserRole
): DashboardModule | null {
  const match = pathname.match(/^\/panel\/([^/]+)\/?$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  return MODULES_BY_ROLE[role].find((mod) => mod.slug === slug) ?? null;
}

export function getModulePath(slug: string): string {
  return `/panel/${encodeURIComponent(slug)}`;
}
