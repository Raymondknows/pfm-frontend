"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Radio, Send, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { WorkspaceShell } from "@/components/workspace-shell";

type Status = { enabled: boolean; state: string; qr: string | null; error?: string | null };
type Option = { id: string; name: string };
type Member = { id: string; firstName: string; lastName: string; whatsappNumber: string | null; status: string };
type TargetMode = "all" | "selected" | "localGovernment";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}` });

export default function WhatsAppPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [lgas, setLgas] = useState<Option[]>([]);
  const [mode, setMode] = useState<TargetMode>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localGovernmentId, setLocalGovernmentId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const [sending, setSending] = useState(false);

  const loadStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/notifications/whatsapp/status`, { headers: authHeaders() });
      const data = await response.json() as Status & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Unable to read WhatsApp connection status");
      setStatus(data);
      setStatusError("");
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unable to read WhatsApp connection status");
    }
  };

  useEffect(() => {
    const loadTargets = async () => {
      try {
        const [memberResponse, stateResponse] = await Promise.all([
          fetch(`${apiUrl}/v1/members?limit=100`, { headers: authHeaders() }),
          fetch(`${apiUrl}/v1/geography/states`, { headers: authHeaders() }),
        ]);
        const memberData = await memberResponse.json() as { data?: Member[] };
        const states = await stateResponse.json() as Option[];
        const lgaLists = await Promise.all(states.map(async (state) => {
          const response = await fetch(`${apiUrl}/v1/geography/states/${state.id}/lgas`, { headers: authHeaders() });
          return response.ok ? await response.json() as Option[] : [];
        }));
        setMembers(memberData.data?.filter((member) => member.status === "ACTIVE" && member.whatsappNumber) ?? []);
        setLgas(lgaLists.flat());
      } catch {
        setResult("Recipient lists could not be loaded. You can still use the all-members target.");
      }
    };
    void loadStatus();
    void loadTargets();
    const refreshTimer = window.setInterval(() => void loadStatus(), 5000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const toggleMember = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const sendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setResult("");
    try {
      const response = await fetch(`${apiUrl}/v1/notifications/whatsapp/broadcast`, {
        method: "POST",
        headers: { ...authHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ mode, membershipIds: mode === "selected" ? selectedIds : undefined, localGovernmentId: mode === "localGovernment" ? localGovernmentId : undefined, subject, body }),
      });
      const data = await response.json() as { sent?: number; failed?: number; message?: string };
      if (!response.ok) throw new Error(data.message ?? "Broadcast failed");
      setResult(`Sent ${data.sent ?? 0} messages. ${data.failed ?? 0} failed.`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Broadcast failed");
    } finally {
      setSending(false);
    }
  };

  const connected = status?.state === "connected";
  const targetReady = mode === "all" || (mode === "selected" && selectedIds.length > 0) || (mode === "localGovernment" && Boolean(localGovernmentId));

  return <WorkspaceShell title="WhatsApp Broadcast" subtitle="Connect one approved WhatsApp account, then send consent-based updates to a precise member audience.">
    <section className="whatsapp-workspace">
      <article className="panel whatsapp-connection">
        <div className="panel-heading"><div><span className="eyebrow">Transport</span><h2>WhatsApp connection</h2></div><Smartphone size={21} color="#247f65" /></div>
        <div className={`connection-status ${connected ? "is-connected" : ""}`}><span className="status-dot" />{status?.enabled ? (status.state === "needs_qr" ? "Waiting for QR scan" : status.state.replaceAll("_", " ")) : "WhatsApp is disabled"}</div>
        {statusError && <p className="form-error"><AlertCircle size={15} />{statusError}</p>}
        {!status?.enabled && <p className="whatsapp-help">Set <strong>WHATSAPP_ENABLED=true</strong> in the backend environment and restart the API. The QR code will appear here.</p>}
        {status?.error && <p className="form-error"><AlertCircle size={15} />{status.error}</p>}
        {status?.qr && <div className="whatsapp-qr"><QRCodeSVG value={status.qr} size={220} /><p>On the phone: WhatsApp -&gt; Linked devices -&gt; Link a device.</p></div>}
        {connected && <p className="form-success"><CheckCircle2 size={15} />Connected and ready to send.</p>}
      </article>

      <form className="panel whatsapp-composer" onSubmit={sendBroadcast}>
        <div className="panel-heading"><div><span className="eyebrow">Audience and message</span><h2>Compose broadcast</h2></div><Radio size={21} color="#247f65" /></div>
        <div className="target-tabs" role="tablist">{([['all', 'All opted-in'], ['selected', 'Selected members'], ['localGovernment', 'By local government']] as const).map(([value, label]) => <button className={mode === value ? "target-tab active" : "target-tab"} key={value} type="button" onClick={() => setMode(value)}>{label}</button>)}</div>
        {mode === "selected" && <div className="recipient-list">{members.length ? members.map((member) => <label className="recipient-row" key={member.id}><input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => toggleMember(member.id)} /><span>{member.firstName} {member.lastName}<small>{member.whatsappNumber}</small></span></label>) : <p className="whatsapp-help">No active opted-in WhatsApp members were loaded.</p>}</div>}
        {mode === "localGovernment" && <label>Local government<select required value={localGovernmentId} onChange={(event) => setLocalGovernmentId(event.target.value)}><option value="">Choose a local government</option>{lgas.map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}</select></label>}
        <label>Subject<input required maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
        <label>Message<textarea required maxLength={4096} rows={7} value={body} onChange={(event) => setBody(event.target.value)} /></label>
        <button className="primary-button" disabled={sending || !connected || !targetReady} type="submit"><Send size={16} />{sending ? "Sending..." : "Send WhatsApp broadcast"}</button>
        {result && <p className={result.includes("Sent") ? "form-success" : "form-error"}>{result}</p>}
      </form>
    </section>
  </WorkspaceShell>;
}
