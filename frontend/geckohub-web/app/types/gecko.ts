// types/gecko.ts
export interface CareLog {
  id: number;
  log_date: string;
  log_type: string;
  weight: number | null;
  note: string;
  image: string | null;
}

export interface Gecko {
  id: number;
  name: string;
  morph: string;
  gender: "Male" | "Female" | "Unknown";
  birth_date: string | null;
  adoption_date: string | null;
  profile_image: string | null;
  description: string;
  sire: number | null;
  dam: number | null;
  logs: CareLog[];
  created_at: string;
}
