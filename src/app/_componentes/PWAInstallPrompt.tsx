"use client";

/**
 * PWAInstallPrompt — Toast de instalación PWA
 *
 * Componente que sugiere al usuario instalar NexoLibre en la pantalla de inicio.
 * Se adapta automáticamente a la plataforma:
 *   - iOS: Muestra instrucciones con el ícono de compartir de Safari
 *   - Android/Desktop: Usa el prompt nativo del navegador (beforeinstallprompt)
 *
 * Se auto-oculta si:
 *   - La app ya está instalada (modo standalone)
 *   - El usuario descartó el prompt (7 días de cooldown)
 *   - La plataforma no soporta instalación
 *
 * Aparece con una animación suave desde abajo tras 3 segundos de carga.
 */

import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function PWAInstallPrompt() {
  const { canPrompt, platform, promptInstall, dismissPrompt } =
    usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Mostrar el toast tras 3 segundos si hay prompt disponible
  useEffect(() => {
    if (!canPrompt) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [canPrompt]);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      dismissPrompt();
    }, 300);
  };

  const handleInstall = async () => {
    if (platform === "ios") {
      // En iOS no hay prompt nativo, solo mostrar instrucciones
      // El toast con instrucciones ya es suficiente
      return;
    }
    await promptInstall();
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar NexoLibre"
      id="pwa-install-prompt"
      className={`pwa-install-toast ${closing ? "pwa-install-toast--closing" : ""}`}
    >
      {/* Barra de progreso decorativa */}
      <div className="pwa-install-toast__progress" />

      <div className="pwa-install-toast__content">
        {/* Ícono de la app */}
        <div className="pwa-install-toast__icon">
          <img
            src="/icon-192.png"
            alt="NexoLibre"
            width={44}
            height={44}
            className="pwa-install-toast__icon-img"
          />
        </div>

        {/* Texto */}
        <div className="pwa-install-toast__text">
          <p className="pwa-install-toast__title">Instalar NexoLibre</p>
          {platform === "ios" ? (
            <p className="pwa-install-toast__description">
              Toca{" "}
              <span className="pwa-install-toast__ios-icon">
                {/* Share icon (Safari) */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: "inline-block", verticalAlign: "middle" }}
                  aria-hidden="true"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>{" "}
              y luego{" "}
              <strong>&quot;Agregar a la pantalla de inicio&quot;</strong>
            </p>
          ) : (
            <p className="pwa-install-toast__description">
              Accede más rápido desde tu pantalla de inicio, sin barra del
              navegador.
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="pwa-install-toast__actions">
        <button
          onClick={handleDismiss}
          className="pwa-install-toast__btn pwa-install-toast__btn--dismiss"
          id="pwa-install-dismiss"
          aria-label="Cerrar sugerencia de instalación"
        >
          Ahora no
        </button>

        {platform !== "ios" && (
          <button
            onClick={handleInstall}
            className="pwa-install-toast__btn pwa-install-toast__btn--install"
            id="pwa-install-accept"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}
