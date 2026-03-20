"use client";

import { Gecko } from "@/app/types/gecko";

interface Props {
  gecko: Gecko;
  imageBase64?: string;
}

export function GeckoShareCard({ gecko, imageBase64 }: Props) {
  const genderLabel =
    gecko.gender === "Male" ? "♂ 수컷" : gecko.gender === "Female" ? "♀ 암컷" : "미구분";
  const genderColor =
    gecko.gender === "Male" ? "#0ea5e9" : gecko.gender === "Female" ? "#f43f5e" : "#94a3b8";

  const ageStr = (() => {
    if (!gecko.birth_date) return null;
    const birth = new Date(gecko.birth_date);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
    if (years < 1) {
      const months =
        (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      return `${months}개월`;
    }
    return `${years}년생`;
  })();

  return (
    <div
      style={{
        width: "360px",
        background: "linear-gradient(150deg, #faf8f3 0%, #f8f6f1 40%, #f1f5f0 100%)",
        borderRadius: "28px",
        overflow: "hidden",
        fontFamily: "'Nunito', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
      }}
    >
      {/* ── 사진 영역 ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "240px",
          overflow: "hidden",
          background: "#e5ddd0",
        }}
      >
        {imageBase64 ? (
          <img
            src={imageBase64}
            alt={gecko.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "80px",
              opacity: 0.12,
            }}
          >
            🦎
          </div>
        )}

        {/* 성별 뱃지 */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: genderColor,
            color: "white",
            fontSize: "11px",
            fontWeight: 800,
            padding: "5px 13px",
            borderRadius: "999px",
          }}
        >
          {genderLabel}
        </div>

        {/* 하단 그라디언트 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "70px",
            background: "linear-gradient(to top, #faf8f3 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 정보 영역 ── */}
      <div style={{ padding: "16px 24px 24px" }}>
        {/* 이름 + 모프 */}
        <h2
          style={{
            margin: 0,
            fontSize: "30px",
            fontWeight: 900,
            color: "#18140e",
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
          }}
        >
          {gecko.name}
        </h2>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "14px",
            fontWeight: 700,
            color: "#5a8a68",
            letterSpacing: "0.1px",
          }}
        >
          {gecko.morph || "모프 정보 없음"}
        </p>

        {/* 스탯 칩 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          {[
            { label: "생년월일", value: gecko.birth_date || "—" },
            { label: "몸무게", value: gecko.weight ? `${gecko.weight}g` : "—" },
            ...(ageStr ? [{ label: "나이", value: ageStr }] : []),
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.045)",
                borderRadius: "14px",
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#211b12",
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#aaa",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* 출처 + 혈통 정보 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          {/* 출처 */}
          {gecko.acquisition_type && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: gecko.acquisition_type === "Hatched"
                  ? "#f0fdf4"
                  : gecko.acquisition_type === "Purchased"
                  ? "#fffbeb"
                  : "#f0f9ff",
                border: `1px solid ${gecko.acquisition_type === "Hatched" ? "#bbf7d0" : gecko.acquisition_type === "Purchased" ? "#fde68a" : "#bae6fd"}`,
                borderRadius: "14px",
                padding: "7px 12px",
              }}
            >
              <span style={{ fontSize: "13px" }}>
                {gecko.acquisition_type === "Hatched" ? "🥚" : gecko.acquisition_type === "Purchased" ? "🏪" : "🫶"}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: gecko.acquisition_type === "Hatched" ? "#15803d" : gecko.acquisition_type === "Purchased" ? "#b45309" : "#0369a1" }}>
                  {gecko.acquisition_type === "Hatched" ? "직접 해칭" : gecko.acquisition_type === "Purchased" ? "샵 구매" : "구조"}
                </p>
                {gecko.acquisition_source && (
                  <p style={{ margin: "1px 0 0", fontSize: "10px", fontWeight: 600, color: "#999" }}>
                    {gecko.acquisition_source}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 부모 정보 */}
          {(gecko.sire_name || gecko.dam_name) && (
            <div
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.035)",
                borderRadius: "14px",
                padding: "7px 12px",
              }}
            >
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#aaa", marginBottom: "4px" }}>PARENTS</p>
              {gecko.sire_name && (
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "#0ea5e9" }}>
                  ♂ {gecko.sire_name}
                </p>
              )}
              {gecko.dam_name && (
                <p style={{ margin: gecko.sire_name ? "2px 0 0" : 0, fontSize: "11px", fontWeight: 800, color: "#f43f5e" }}>
                  ♀ {gecko.dam_name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 건강 상태 태그 */}
        {(gecko.is_ovulating || gecko.mbd) && (
          <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
            {gecko.is_ovulating && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#e11d48",
                  background: "#fff1f4",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  border: "1px solid #fecdd3",
                }}
              >
                🥚 배란중
              </span>
            )}
            {gecko.mbd && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#7c3aed",
                  background: "#f5f3ff",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  border: "1px solid #ddd6fe",
                }}
              >
                🦴 MBD
              </span>
            )}
          </div>
        )}

        {/* 브랜딩 */}
        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.06)",
            marginTop: "18px",
            paddingTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "16px" }}>🌿</span>
            <span style={{ fontSize: "15px", fontWeight: 900, color: "#3d7a52" }}>GeckoHub</span>
          </div>
          <span style={{ fontSize: "11px", color: "#ccc", fontWeight: 600 }}>
            geckohub.vercel.app
          </span>
        </div>
      </div>
    </div>
  );
}
