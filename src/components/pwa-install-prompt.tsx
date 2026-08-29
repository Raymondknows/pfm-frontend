"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

declare global { interface Window { deferredInstallPrompt?: BeforeInstallPromptEvent } }
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) return;
    const onInstallAvailable = (event: Event) => { event.preventDefault(); setPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onInstallAvailable);
    const onInstalled = () => setPrompt(null);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => { window.removeEventListener("beforeinstallprompt", onInstallAvailable); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (!prompt || dismissed) return null;
  return <div className="install-prompt"><span className="install-prompt-icon"><Download size={17} /></span><span><strong>Install PFM</strong><small>Keep your workspace one tap away</small></span><button onClick={() => prompt.prompt()} className="install-action">Install</button><button onClick={() => setDismissed(true)} className="install-dismiss" aria-label="Dismiss install prompt"><X size={15} /></button></div>;
}
