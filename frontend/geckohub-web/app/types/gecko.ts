// types/gecko.ts

export interface CareLog {
  id: number;
  gecko: number;
  log_type: string;
  log_date: string;
  weight: number | null;
  note: string;
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

  // 2. 새로 추가된 상세 정보 필드
  sire_detail: ParentGecko | null;
  dam_detail: ParentGecko | null;

  logs: CareLog[];
}
