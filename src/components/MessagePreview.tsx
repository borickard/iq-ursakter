"use client";

import { IosMessages, type IosMessagesProps } from "@/components/IosMessages";
import { AndroidMessages } from "@/components/AndroidMessages";
import type { Platform } from "@/lib/device";
import { COPY } from "@/lib/copy";

/**
 * Visar den fejkade meddelande-skärmen i rätt plattforms-look (iOS eller
 * Android). Plattformen gissas från enheten men kan bytas manuellt med den lilla
 * växeln längst ner – så att man kan testa båda utseendena oavsett egen telefon.
 * Växeln visas bara när `onPlatformChange` skickas in.
 */
type Props = IosMessagesProps & {
  platform: Platform;
  onPlatformChange?: (p: Platform) => void;
};

export function MessagePreview({ platform, onPlatformChange, ...screen }: Props) {
  return (
    <div className="relative h-full">
      {platform === "android" ? (
        <AndroidMessages {...screen} />
      ) : (
        <IosMessages {...screen} />
      )}

      {onPlatformChange && (
        <div
          className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 overflow-hidden rounded-full border border-white/25 bg-black/55 p-0.5 text-[12px] font-semibold text-white shadow-lg backdrop-blur"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <Toggle active={platform === "ios"} onClick={() => onPlatformChange("ios")}>
            {COPY.compose.previewIos}
          </Toggle>
          <Toggle
            active={platform === "android"}
            onClick={() => onPlatformChange("android")}
          >
            {COPY.compose.previewAndroid}
          </Toggle>
        </div>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3.5 py-1.5 transition " +
        (active ? "bg-white text-black" : "text-white/80")
      }
    >
      {children}
    </button>
  );
}
