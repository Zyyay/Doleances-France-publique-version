import { ImageResponse } from "next/og";

export const alt = "Doléances — Le référendum permanent pour changer l'action publique";
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
          padding: "80px 96px",
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
            marginBottom: 40,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#4f46e5", display: "flex" }} />
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
            Plateforme citoyenne indépendante
          </div>
        </div>
        <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.12, maxWidth: 980, display: "flex" }}>
          Faire union autour des sujets qui rassemblent déjà les Français
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 56 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#ffffff",
              color: "#4f46e5",
              fontSize: 26,
              fontWeight: 700,
              padding: "16px 32px",
              borderRadius: 999,
            }}
          >
            Doléances
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
