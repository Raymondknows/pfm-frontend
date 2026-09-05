"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, ClipboardCheck, Upload } from "lucide-react";
import { useSessionHandler } from "@/lib/session";

type Option = { id: string; name: string; code: string };
type MonitoringEvent = { id: string; name: string; startsAt: string; endsAt: string | null; isActive: boolean };
type Evidence = { id: string; originalName: string; size: number };
type Observation = { id: string; status: string; category: string; notes: string; observedAt: string; monitoringEvent: { name: string }; pollingUnit: { name: string }; reporter: { firstName: string; lastName: string; email: string | null } };
type MonitoringAnalytics = { total: number; coveredPollingUnits: number; byStatus: Array<{ status: string; count: number }>; byCategory: Array<{ category: string; count: number }> };
const apiUrl = (() => { const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api"; const normalized = raw.replace(/\/+$/, ""); return normalized.endsWith("/api") ? normalized : `${normalized}/api`; })();
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}` });
const categories = ["SETUP", "ACCREDITATION", "VOTING", "COUNTING", "RESULT", "INCIDENT", "ACCESSIBILITY", "LOGISTICS"];
const draftStorageKey = "pfm.election-monitoring.draft";

function encodeBytes(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function decodeBytes(value: string) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); }
async function draftKey() {
  const stored = sessionStorage.getItem("pfm.election-monitoring.key");
  if (stored) return crypto.subtle.importKey("raw", decodeBytes(stored), "AES-GCM", false, ["encrypt", "decrypt"]);
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  sessionStorage.setItem("pfm.election-monitoring.key", encodeBytes(new Uint8Array(raw)));
  return key;
}
async function saveDraft(form: Record<string, string>, idempotencyKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify({ form, idempotencyKey }));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await draftKey(), payload);
  localStorage.setItem(draftStorageKey, JSON.stringify({ iv: encodeBytes(iv), data: encodeBytes(new Uint8Array(encrypted)) }));
}
async function loadDraft(): Promise<{ form: Record<string, string>; idempotencyKey: string } | null> {
  const stored = localStorage.getItem(draftStorageKey);
  if (!stored) return null;
  try { const value = JSON.parse(stored) as { iv: string; data: string }; const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decodeBytes(value.iv) }, await draftKey(), decodeBytes(value.data)); return JSON.parse(new TextDecoder().decode(decrypted)); } catch { return null; }
}
async function prepareEvidence(file: File) {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.82));
    return blob ? new File([blob], file.name, { type: blob.type, lastModified: file.lastModified }) : file;
  } catch {
    return file;
  }
}

async function getArray<T>(url: string, onUnauthorized: (status: number) => boolean): Promise<T[]> {
  const response = await fetch(url, { headers: auth() });
  if (onUnauthorized(response.status)) return [];
  if (!response.ok) throw new Error(`Election monitoring data could not be loaded (${response.status})`);
  const data: unknown = await response.json();
  return Array.isArray(data) ? data as T[] : [];
}

async function getJson<T>(url: string, onUnauthorized: (status: number) => boolean): Promise<T> {
  const response = await fetch(url, { headers: auth() });
  if (onUnauthorized(response.status)) throw new Error("Session expired");
  if (!response.ok) throw new Error(`Election monitoring data could not be loaded (${response.status})`);
  return response.json() as Promise<T>;
}

function ReviewerQueue() {
  const { handleUnauthorizedResponse } = useSessionHandler();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [analytics, setAnalytics] = useState<MonitoringAnalytics | null>(null);
  const [exportId, setExportId] = useState("");
  const [exportReady, setExportReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try { setIsSuperAdmin(JSON.parse(localStorage.getItem("pfm.user") ?? "{}").roles?.some((role: { name?: string }) => role.name === "Super Admin") ?? false); } catch { setIsSuperAdmin(false); }
  }, []);
  useEffect(() => { if (!isSuperAdmin) return; getArray<Observation>(`${apiUrl}/v1/election-monitoring/observations`, handleUnauthorizedResponse).then(setObservations).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Observations could not be loaded")); getJson<MonitoringAnalytics>(`${apiUrl}/v1/election-monitoring/analytics`, handleUnauthorizedResponse).then(setAnalytics).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Monitoring analytics could not be loaded")); }, [isSuperAdmin, handleUnauthorizedResponse]);

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`${apiUrl}/v1/election-monitoring/observations/${id}/status`, { method: "PATCH", headers: { ...auth(), "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (handleUnauthorizedResponse(response.status)) return;
    if (!response.ok) { setError("The observation status could not be updated"); return; }
    setObservations((current) => current.map((observation) => observation.id === id ? { ...observation, status } : observation));
  }

  async function requestExport() {
    setExportReady(false); setExportId("");
    const response = await fetch(`${apiUrl}/v1/election-monitoring/exports`, { method: "POST", headers: { ...auth(), "content-type": "application/json" }, body: "{}" });
    if (!response.ok) { setError("The export could not be requested"); return; }
    const exportJob = await response.json(); setExportId(exportJob.id);
    const poll = async () => { const current = await getJson<{ status: string }>(`${apiUrl}/v1/election-monitoring/exports/${exportJob.id}`, handleUnauthorizedResponse); if (current.status === "READY") setExportReady(true); else if (current.status === "QUEUED" || current.status === "PROCESSING") window.setTimeout(() => void poll(), 1000); else setError("The export failed to generate"); };
    void poll();
  }

  if (!isSuperAdmin) return null;
  return <section className="panel election-review-queue"><div className="panel-heading"><div><span className="eyebrow">Super Admin review</span><h2>Observation queue</h2><p>Review submissions and keep decisions inside the authorized workspace.</p></div><div className="election-review-toolbar"><span className="status-badge">{observations.length} submissions</span><button className="secondary-button" type="button" onClick={() => void requestExport()}>Export CSV</button>{exportReady && exportId && <a className="secondary-button" href={`${apiUrl}/v1/election-monitoring/exports/${exportId}/file`} target="_blank" rel="noreferrer">Download</a>}</div></div>{analytics && <div className="election-review-metrics"><strong>{analytics.total}<small>Total observations</small></strong><strong>{analytics.coveredPollingUnits}<small>Polling units covered</small></strong><strong>{analytics.byStatus.find((item) => item.status === "SUBMITTED")?.count ?? 0}<small>Awaiting review</small></strong></div>}{error && <p className="form-error">{error}</p>}{observations.length === 0 ? <p className="empty-state-copy">No observations have been submitted yet.</p> : <div className="election-review-list">{observations.map((observation) => <article className="election-review-item" key={observation.id}><div><strong>{observation.category} · {observation.pollingUnit.name}</strong><p>{observation.notes}</p><small>{observation.monitoringEvent.name} · {observation.reporter.firstName} {observation.reporter.lastName} · {new Date(observation.observedAt).toLocaleString()}</small></div><div className="election-review-actions"><span className="status-badge">{observation.status}</span><select value={observation.status} onChange={(event) => void updateStatus(observation.id, event.target.value)}><option value={observation.status}>{observation.status}</option><option value="UNDER_REVIEW">UNDER_REVIEW</option><option value="NEEDS_CLARIFICATION">NEEDS_CLARIFICATION</option><option value="ESCALATED">ESCALATED</option><option value="VERIFIED">VERIFIED</option><option value="REJECTED">REJECTED</option></select></div></article>)}</div>}</section>;
}

export function ElectionMonitoringWorkspace() {
  const { handleUnauthorizedResponse } = useSessionHandler();
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [lgas, setLgas] = useState<Option[]>([]);
  const [wards, setWards] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<Evidence[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [form, setForm] = useState({ monitoringEventId: "", stateId: "", localGovernmentId: "", wardId: "", pollingUnitId: "", category: "INCIDENT", notes: "", observedAt: new Date().toISOString().slice(0, 16) });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => { void loadDraft().then((draft) => { if (!draft) { setIdempotencyKey(crypto.randomUUID()); return; } setForm((current) => ({ ...current, ...draft.form })); setIdempotencyKey(draft.idempotencyKey); setDraftStatus("Encrypted draft restored"); }); }, []);
  useEffect(() => { if (!idempotencyKey) return; const timer = window.setTimeout(() => { void saveDraft(form, idempotencyKey).then(() => setDraftStatus("Draft saved securely on this device")); }, 400); return () => window.clearTimeout(timer); }, [form, idempotencyKey]);

  useEffect(() => { getArray<MonitoringEvent>(`${apiUrl}/v1/election-monitoring/events`, handleUnauthorizedResponse).then(setEvents).catch((loadError) => { setEvents([]); setError(loadError instanceof Error ? loadError.message : "Monitoring events could not be loaded"); }); getArray<Option>(`${apiUrl}/v1/geography/states`, handleUnauthorizedResponse).then((availableStates) => { const ogun = availableStates.find((state) => state.name.toLowerCase() === "ogun" || state.code.toLowerCase() === "og"); setStates(ogun ? [ogun] : []); if (ogun) setForm((current) => ({ ...current, stateId: ogun.id })); else setError("Ogun state is not available in the organization geography"); }).catch((loadError) => { setStates([]); setError(loadError instanceof Error ? loadError.message : "Ogun state could not be loaded"); }); }, [handleUnauthorizedResponse]);
  useEffect(() => { if (!form.stateId) { setLgas([]); return; } getArray<Option>(`${apiUrl}/v1/geography/states/${form.stateId}/lgas`, handleUnauthorizedResponse).then(setLgas).catch((loadError) => { setLgas([]); setError(loadError instanceof Error ? loadError.message : "LGAs could not be loaded"); }); }, [form.stateId, handleUnauthorizedResponse]);
  useEffect(() => { if (!form.localGovernmentId) { setWards([]); return; } getArray<Option>(`${apiUrl}/v1/geography/lgas/${form.localGovernmentId}/wards`, handleUnauthorizedResponse).then(setWards).catch((loadError) => { setWards([]); setError(loadError instanceof Error ? loadError.message : "Wards could not be loaded"); }); }, [form.localGovernmentId, handleUnauthorizedResponse]);
  useEffect(() => { if (!form.wardId) { setUnits([]); return; } getArray<Option>(`${apiUrl}/v1/geography/wards/${form.wardId}/polling-units`, handleUnauthorizedResponse).then(setUnits).catch((loadError) => { setUnits([]); setError(loadError instanceof Error ? loadError.message : "Polling units could not be loaded"); }); }, [form.wardId, handleUnauthorizedResponse]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus(""); setUploaded([]); setReceiptId("");
    if (files.length > 0 && !privacyAcknowledged) { setError("Please confirm that evidence contains no unnecessary voter-identifying information."); return; }
    const submissionKey = idempotencyKey || crypto.randomUUID();
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/v1/election-monitoring/observations`, { method: "POST", headers: { ...auth(), "content-type": "application/json" }, body: JSON.stringify({ monitoringEventId: form.monitoringEventId, pollingUnitId: form.pollingUnitId, category: form.category, notes: form.notes, observedAt: new Date(form.observedAt).toISOString(), idempotencyKey: submissionKey }) });
    } catch { setDraftStatus("Offline: encrypted draft kept for retry"); return; }
    if (handleUnauthorizedResponse(response.status)) return;
    if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.message ?? "Observation could not be submitted"); return; }
    const observation = await response.json();
    try {
      const results = await Promise.all(files.map(async (file) => { const prepared = await prepareEvidence(file); const data = new FormData(); data.append("file", prepared); const upload = await fetch(`${apiUrl}/v1/election-monitoring/observations/${observation.id}/attachments`, { method: "POST", headers: auth(), body: data }); if (!upload.ok) throw new Error(`${file.name} could not be uploaded`); return upload.json(); }));
      setUploaded(results); setReceiptId(observation.id); setStatus(files.length ? "Observation and evidence submitted for Super Admin review." : "Observation submitted for Super Admin review."); localStorage.removeItem(draftStorageKey); setDraftStatus(""); setFiles([]); setIdempotencyKey(crypto.randomUUID()); setForm((current) => ({ ...current, notes: "" }));
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Evidence upload failed after the observation was submitted"); }
  }

  return <><div className="election-monitor-workspace"><div className="election-monitor-submission-head"><div><span className="eyebrow">Field submission</span><h2>Submit a polling-unit observation</h2><p>Your submission will be visible to Super Admin reviewers only.</p></div><Camera size={28} /></div>{draftStatus && <p className="form-success">{draftStatus}</p>}{status && <p className="form-success">{status}{uploaded.length ? ` ${uploaded.length} file${uploaded.length === 1 ? "" : "s"} attached.` : ""}{receiptId ? ` Receipt: ${receiptId}` : ""}</p>}{error && <p className="form-error">{error}</p>}<form className="workspace-form" onSubmit={submit}><label>Monitoring event<select required value={form.monitoringEventId} onChange={(event) => update("monitoringEventId", event.target.value)}><option value="">Choose an active event</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="geo-grid"><label>State<select required disabled value={form.stateId}><option value="">Loading Ogun state</option>{states.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>LGA<select required value={form.localGovernmentId} disabled={!form.stateId} onChange={(event) => { update("localGovernmentId", event.target.value); update("wardId", ""); update("pollingUnitId", ""); }}><option value="">Choose LGA</option>{lgas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Ward<select required value={form.wardId} disabled={!form.localGovernmentId} onChange={(event) => { update("wardId", event.target.value); update("pollingUnitId", ""); }}><option value="">Choose ward</option>{wards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Polling Unit<select required value={form.pollingUnitId} disabled={!form.wardId} onChange={(event) => update("pollingUnitId", event.target.value)}><option value="">Choose polling unit</option>{units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="geo-grid"><label>Category<select required value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Observed at<input required type="datetime-local" value={form.observedAt} onChange={(event) => update("observedAt", event.target.value)} /></label></div><label>Observation notes<textarea required maxLength={5000} rows={5} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Describe what you observed at this polling unit." /></label><label className="file-picker"><span><Upload size={16} />Evidence files</span><small>Do not include faces, voter information, ballots, or sensitive documents unless strictly necessary. Redact identifying details before upload.</small><small>Up to five files, 15 MB each. JPEG, PNG, WebP, MP4, PDF, or audio.</small><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf,audio/*" capture="environment" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} />{files.length > 0 && <><small>{files.map((file) => file.name).join(", ")}</small><label><input type="checkbox" checked={privacyAcknowledged} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} /> I confirm these files contain no unnecessary voter-identifying information.</label></>}</label><button className="primary-button" type="submit"><ClipboardCheck size={17} />Submit observation</button></form></div><ReviewerQueue /></>;
}