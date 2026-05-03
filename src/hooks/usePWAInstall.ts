"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Tipos ────────────────────────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

type Platform = "android" | "ios" | "desktop" | "unknown";
type InstallState = "idle" | "available" | "installed" | "dismissed";

interface UsePWAInstallReturn {
  /** Estado actual del prompt de instalación */
  installState: InstallState;
  /** Plataforma detectada del usuario */
  platform: Platform;
  /** true si la app ya se ejecuta en modo standalone (instalada) */
  isStandalone: boolean;
  /** true si se puede mostrar un prompt de instalación (nativo o manual) */
  canPrompt: boolean;
  /** Dispara el prompt nativo de instalación (solo Android/desktop) */
  promptInstall: () => Promise<void>;
  /** Descarta el prompt (establece dismissed, guarda en localStorage) */
  dismissPrompt: () => void;
}

/* ── Constantes ───────────────────────────────────────────────────────────── */

const DISMISS_KEY = "nexolibre-pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

/* ── Detección de plataforma ──────────────────────────────────────────────── */

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent.toLowerCase();

  // iOS: iPhone, iPad, iPod (incluye iPadOS que se identifica como Mac)
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/macintosh/.test(ua) && "ontouchend" in document) return "ios"; // iPadOS

  // Android
  if (/android/.test(ua)) return "android";

  // Desktop
  return "desktop";
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // Modo standalone (Android/Desktop PWA)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;

  // iOS standalone mode
  if ("standalone" in window.navigator) {
    return (window.navigator as Navigator & { standalone: boolean }).standalone;
  }

  return false;
}

function wasDismissedRecently(): boolean {
  if (typeof localStorage === "undefined") return false;

  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;

  const elapsed = Date.now() - parseInt(dismissedAt, 10);
  return elapsed < DISMISS_DURATION_MS;
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function usePWAInstall(): UsePWAInstallReturn {
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const detectedPlatform = detectPlatform();
    const standalone = checkIsStandalone();

    setPlatform(detectedPlatform);
    setIsStandalone(standalone);

    // Si ya está instalada, no mostrar prompt
    if (standalone) {
      setInstallState("installed");
      return;
    }

    // Si fue descartado recientemente, no mostrar
    if (wasDismissedRecently()) {
      setInstallState("dismissed");
      return;
    }

    // Para iOS: siempre mostrar el prompt manual (no hay beforeinstallprompt)
    if (detectedPlatform === "ios") {
      setInstallState("available");
      return;
    }

    // Para Android/Desktop: escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState("available");
    };

    const handleAppInstalled = () => {
      setInstallState("installed");
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallState("installed");
      } else {
        setInstallState("dismissed");
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
      }
    } catch (err) {
      console.error("Error prompting PWA install:", err);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setInstallState("dismissed");
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDeferredPrompt(null);
  }, []);

  const canPrompt =
    installState === "available" && !isStandalone && !wasDismissedRecently();

  return {
    installState,
    platform,
    isStandalone,
    canPrompt,
    promptInstall,
    dismissPrompt,
  };
}
