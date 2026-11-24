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
 * Plattform för "lägg till på hemskärmen"-tipset. Skiljer på iOS, Android och
 * "other" (desktop/okänt → inget tips). iPadOS 13+ rapporterar sig som Mac med
 * pekskärm, så det fångas separat.
 */
export type InstallPlatform = "ios" | "android" | "other";
export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined" || typeof window === "undefined")
    return "other";
  const ua = navigator.userAgent || "";
  const maxTouch = (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints ?? 0;
  const iPadOS = /Macintosh/.test(ua) && maxTouch > 1;
  if (/iphone|ipad|ipod/i.test(ua) || iPadOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

/** Körs appen redan som hemskärms-app (standalone)? Då behövs inget tips. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true,
  );
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
