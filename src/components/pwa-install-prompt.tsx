"use client";

import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global { interface Window { deferredInstallPrompt?: BeforeInstallPromptEvent } }
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const hasShown = useRef(false);

  useEffect(() => {
    const updateAuthentication = () => setAuthenticated(Boolean(localStorage.getItem("pfm.accessToken")));
    updateAuthentication();
    window.addEventListener("storage", updateAuthentication);
    return () => window.removeEventListener("storage", updateAuthentication);
  }, []);

  useEffect(() => {
    if (authenticated) {
      setPrompt(null);
      return;
    }
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) return;

    const onInstallAvailable = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setPrompt(null);
      setDismissed(true);
    };

    const maybeAutoShow = () => {
      if (hasShown.current || dismissed) return;
      hasShown.current = true;
      window.setTimeout(() => {
        if (document.visibilityState === "visible" && !window.matchMedia("(display-mode: standalone)").matches) {
          setPrompt((current) => current ?? (window.deferredInstallPrompt as BeforeInstallPromptEvent | null) ?? null);
        }
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", onInstallAvailable);
    window.addEventListener("appinstalled", onInstalled);
    maybeAutoShow();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallAvailable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [authenticated, dismissed]);

  if (authenticated || !prompt || dismissed) return null;

  return (
    <div className="install-prompt">
      <span className="install-prompt-icon"><Download size={17} /></span>
      <span>
        <strong>Install PFM</strong>
        <small>Open the app faster on your device</small>
      </span>
      <button onClick={() => prompt.prompt()} className="install-action">Install</button>
      <button onClick={() => setDismissed(true)} className="install-dismiss" aria-label="Dismiss install prompt"><X size={15} /></button>
    </div>
  );
}
