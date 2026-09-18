"use client";

import { useEffect, useState } from "react";
import { Send, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { WorkspaceShell } from "@/components/workspace-shell";

type Status = { enabled: boolean; state: string; qr: string | null };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export default function WhatsAppPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const [sending, setSending] = useState(false);

  const loadStatus = async () => {
    const token = localStorage.getItem("pfm.accessToken");
    const response = await fetch(`${apiUrl}/v1/notifications/whatsapp/status`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setStatus(await response.json() as Status);
  };

  useEffect(() => {
    void loadStatus();
    const refreshTimer = window.setInterval(() => void loadStatus(), 5000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const sendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setResult("");
    const token = localStorage.getItem("pfm.accessToken");
    const response = await fetch(`${apiUrl}/v1/notifications/whatsapp/broadcast`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ subject, body }) });
    const data = await response.json() as { sent?: number; failed?: number; message?: string };
    setResult(response.ok ? `Sent ${data.sent ?? 0} messages. ${data.failed ?? 0} failed.` : data.message ?? "Broadcast failed.");
    setSending(false);
  };

  return <WorkspaceShell title="WhatsApp Broadcast" subtitle="Send consent-based WhatsApp updates to active members from the connected Baileys session.">
    <section className="settings-grid">
      <article className="panel settings-card"><Smartphone size={19} color="#247f65" /><h2>Connection</h2><p>{status?.enabled ? status.state.replaceAll("_", " ") : "disabled"}</p><span>{status?.qr ? "Scan this QR code with WhatsApp Linked Devices." : "Session credentials stay on the backend server."}</span>{status?.qr && <div className="whatsapp-qr"><QRCodeSVG value={status.qr} size={220} /></div>}</article>
      <form className="panel settings-card" onSubmit={sendBroadcast}><Send size={19} color="#247f65" /><h2>Broadcast</h2><label>Subject<input required maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} /></label><label>Message<textarea required maxLength={4096} rows={7} value={body} onChange={(event) => setBody(event.target.value)} /></label><button className="primary-button" disabled={sending || status?.state !== "connected"} type="submit">{sending ? "Sending..." : "Send to opted-in members"}</button>{result && <p className="form-success">{result}</p>}</form>
    </section>
  </WorkspaceShell>;
}