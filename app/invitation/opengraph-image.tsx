import { ImageResponse } from "next/og";

export const alt = "Vous avez été invité sur Doléances";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "80px 120px",
          background: "#1e293b",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 36,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#4f46e5", display: "flex" }} />
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
            On vous a envoyé ce lien
          </div>
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.18, maxWidth: 940, display: "flex" }}>
          Un consensus existe déjà sur des dizaines de sujets.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 48,
            background: "#ffffff",
            color: "#4f46e5",
            fontSize: 24,
            fontWeight: 700,
            padding: "14px 28px",
            borderRadius: 999,
          }}
        >
          Démarrer un vote express
        </div>
      </div>
    ),
    { ...size }
  );
}
