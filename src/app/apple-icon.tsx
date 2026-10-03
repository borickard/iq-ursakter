import { ImageResponse } from "next/og";

// Hemskärms-ikon (iOS). Genereras vid build – ingen bildfil behövs i repot.
// Limegrön bricka med ett mörkt hjärta (extraliv) – matchar ordmärket.
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
          background: "#d7ff3e",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24">
          <path
            d="M12 21C12 21 3 14.6 3 8.6C3 5.6 5.3 3.6 8 3.6C9.8 3.6 11.3 4.7 12 6.1C12.7 4.7 14.2 3.6 16 3.6C18.7 3.6 21 5.6 21 8.6C21 14.6 12 21 12 21Z"
            fill="#0b0b0b"
          />
        </svg>
      </div>
    ),
    size,
  );
}
