// types/gecko.ts

export interface CareLog {
  id: number;
  gecko: number;
  log_type: string;
  log_date: string;
  weight: number | null;
  note: string;

  // 산란 관련
  egg_count?: number;
  is_fertile?: boolean;
  egg_condition?: string;

  // 메이팅 관련
  partner?: number;
  partner_detail?: ParentGecko;
  mating_success?: boolean;
  partner_name?: string;

  //이 로그의 주인 정보
  gecko_detail?: ParentGecko;
}

// 1. 부모용 미니 타입 정의
export interface ParentGecko {
  id: number;
  name: string;
  profile_image: string | null;
}

export interface Gecko {
  id: number;
  name: string;
  morph: string;
  gender: string;
  birth_date: string;
  description: string;
  profile_image: string | null;
  sire: number | null; // ID 값 (수정용)
  dam: number | null; // ID 값 (수정용)
  is_ovulating: boolean;
  sire_detail: ParentGecko | null;
  dam_detail: ParentGecko | null;
  logs: CareLog[];
  tail_loss: boolean;
  mbd: boolean;
  has_spots: boolean;
  acquisition_type: "Purchased" | "Hatched" | "Rescue";
  acquisition_source?: string;
  sire_name?: string;
  dam_name?: string;
}
