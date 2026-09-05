"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, CalendarPlus, CheckCircle2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { useSessionHandler } from "@/lib/session";

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

export function EventForm() {
  const { handleUnauthorizedResponse } = useSessionHandler();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${apiUrl}/v1/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}`, "content-type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), description: form.get("description"), startsAt: form.get("startsAt"), endsAt: form.get("endsAt") || undefined }),
    });
    if (handleUnauthorizedResponse(response.status)) return;
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Event could not be created");
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  }

  return <WorkspaceShell title="New Event" subtitle="Schedule a gathering for your organization." hidePageHeader><section className="panel form-panel">{saved ? <div className="success-state"><CheckCircle2 size={28} /><h2>Event created</h2><p>Your event is now available to authorized organization users.</p><a className="primary-button" href="/events">View events</a></div> : <form className="workspace-form" onSubmit={submit}><div className="form-section-heading"><div className="form-section-icon"><CalendarPlus size={18} /></div><div><h2>Event details</h2><p>Add the essential information people need to attend.</p></div></div>{error && <p className="form-error">{error}</p>}<label>Event name<input name="title" required maxLength={160} placeholder="e.g. Ward coordination meeting" /></label><label>Description<textarea name="description" required maxLength={4000} rows={5} placeholder="What is this event about?" /></label><div className="form-grid"><label>Starts at<input name="startsAt" type="datetime-local" required /></label><label>Ends at<input name="endsAt" type="datetime-local" /></label></div><div className="form-actions"><a className="secondary-button" href="/events"><ArrowLeft size={15} />Cancel</a><button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating..." : "Create event"}</button></div></form>}</section></WorkspaceShell>;
}
