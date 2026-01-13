// app/types/gecko.ts

export interface ParentGecko {
  id: number;
  name: string;
  profile_image: string | null;
  gender?: string;
}

export interface CareLog {
  id: number;
  gecko: number; // 로그 주인 ID
  log_type: string;
  log_date: string;
  weight?: number | null;
  note?: string;
  image?: string | null;

  // 번식 관련 (Mating/Laying)
  partner?: number | null;
  partner_name?: string | null;
  partner_detail?: ParentGecko | null;
  gecko_detail?: ParentGecko | null; // 작성자 정보 (상대방 페이지에서 보일 때)
  mating_success?: boolean;

  // 산란 및 인큐베이터 관련
  egg_count?: number | null;
  is_fertile?: boolean;
  egg_condition?: string;
  incubation_temp?: number | null; // 🔥 [추가] 온도
  expected_hatching_date?: string | null; // 🔥 [추가] 해칭 예정일
  expected_morph?: string | null; // 🔥 [추가] 예상 모프
}

export interface Gecko {
  id: number;
  name: string;
  morph?: string;
  gender: string;
  birth_date?: string;
  description?: string;
  profile_image: string | null;
  created_at?: string;
  weight?: number | null; // 현재 무게

  // 혈통 정보
  sire?: number | null;
  dam?: number | null;
  sire_name?: string;
  dam_name?: string;
  sire_detail?: ParentGecko;
  dam_detail?: ParentGecko;

  // 로그
  logs: CareLog[];

  // 상태
  is_ovulating?: boolean;

  // 건강 & 출처
  tail_loss?: boolean;
  mbd?: boolean;
  has_spots?: boolean;
  acquisition_type?: "Purchased" | "Hatched" | "Rescue";
  acquisition_source?: string;
}
