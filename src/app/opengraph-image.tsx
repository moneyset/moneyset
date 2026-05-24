import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MONEYSET";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(152deg, #050508 0%, #0a0c12 48%, #12151c 100%)",
          color: "#f4f4f5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: "0.38em" }}>MONEYSET</div>
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            color: "rgba(139, 155, 176, 0.95)",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Market cognition
        </div>
        <div style={{ marginTop: 40, fontSize: 17, color: "rgba(244, 244, 245, 0.45)", maxWidth: 780, textAlign: "center" }}>
          Posture · danger · consensus · scenarios — calm intelligence, not noise
        </div>
      </div>
    ),
    { ...size },
  );
}
