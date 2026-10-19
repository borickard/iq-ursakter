import { ImageResponse } from "next/og";

// Hemskärms-ikon (iOS). Genereras vid build – ingen bildfil behövs i repot.
// IQ-gul bricka med ett svart bokstavsmärke "U" (Ursäkten) – utan hjärta sedan
// namnbytet.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#EFFE53",
          color: "#000000",
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        U
      </div>
    ),
    size,
  );
}
