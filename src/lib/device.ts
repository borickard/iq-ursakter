"use client";

import { useEffect, useState } from "react";

/**
 * Vilken telefon-look mockupen ska visa. Default är iOS (appens ton är
 * iOS-aktig och de flesta testare har iPhone); Android väljs om webbläsarens
 * user-agent ser ut som en Android-enhet.
 */
export type Platform = "ios" | "android";

/** Gissar plattform från user-agent. Okänt/desktop → "ios". */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "ios";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  return "ios";
}

/**
 * Telefonen visar alltid ett ÄKTA statusfält (klocka/batteri) i en vanlig
 * mobil-webbläsare och som hemskärms-app. Dölj därför mockupens egna statusfält
 * på pekskärmar så det inte blir dubbla. Behålls på desktop (inget äkta finns).
 */
export function useHideFakeStatusBar(): boolean {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    setHide(Boolean(standalone || coarse));
  }, []);
  return hide;
}
