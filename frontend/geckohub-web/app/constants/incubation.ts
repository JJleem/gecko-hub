// app/constants/incubation.ts

// 표에 있는 온도별 평균 해칭 소요 일수
// 22도: 85~90일 -> 평균 87일
// 23도: 80~85일 -> 평균 82일
// 23.5도: 75~80일 -> 평균 77일
// 24도: 70~75일 -> 평균 72일
// 24.5도: 65~70일 -> 평균 67일
// 25도: 60~65일 -> 평균 62일

export const INCUBATION_DATA = [
  { temp: 22.0, min: 85, max: 90, avg: 87 },
  { temp: 23.0, min: 80, max: 85, avg: 82 },
  { temp: 23.5, min: 75, max: 80, avg: 77 },
  { temp: 24.0, min: 70, max: 75, avg: 72 },
  { temp: 24.5, min: 65, max: 70, avg: 67 },
  { temp: 25.0, min: 60, max: 65, avg: 62 },
];

export const calculateHatchingDate = (dateString: string, temp: number) => {
  const target = INCUBATION_DATA.find((d) => d.temp === temp);
  if (!target) return null;

  const date = new Date(dateString);
  date.setDate(date.getDate() + target.avg); // 평균 일수를 더함

  // YYYY-MM-DD 형식으로 반환
  return date.toISOString().split("T")[0];
};
