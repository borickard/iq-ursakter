import { ImageResponse } from "next/og";

// Hemskärms-ikon (iOS). Genereras vid build – ingen bildfil behövs i repot.
// Ett enkelt vitt meddelande-bubbelmärke på den rosa gradienten (ingen emoji).
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
          background: "#17795e",
        }}
      >
        <div
          style={{
            width: 104,
            height: 84,
            background: "#ffffff",
            borderRadius: "44px 44px 44px 10px",
          }}
        />
      </div>
    ),
    size,
  );
}
