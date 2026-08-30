"use client";

import { BarChart3, CalendarDays, MapPinned, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";

type HubSummary = {
  role: string;
  scopeType: string;
  members: number;
  activeMembers: number;
  communities: number;
  upcomingEvents: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";

export function RoleHubDashboard({ requestedRole }: { requestedRole: string }) {
  const [summary, setSummary] = useState<HubSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${apiUrl}/v1/analytics/hub`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || typeof body !== "object" || body === null) {
          throw new Error("Unable to load your hub dashboard");
        }
        return body as HubSummary;
      })
      .then(setSummary)
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your hub dashboard",
        ),
      );
  }, []);

  const role = summary?.role ?? requestedRole;
  const scope = summary?.scopeType?.replace("_", " ") ?? "AUTHORIZED";
  return (
    <WorkspaceShell
      title={`${role} hub`}
      subtitle="A role-aware operating view shaped by your assigned organization and geographic scope."
    >
      {error ? (
        <section className="panel page-panel">
          <div className="error-state"><strong>{error}</strong><a className="secondary-button" href="/login">Sign in again</a></div>
        </section>
      ) : (
        <>
          <section className="hub-banner"><div className="hub-banner-icon"><ShieldCheck size={22} /></div><div><span className="eyebrow">Authorized hub</span><h2>{role}</h2><p>{scope} scope · Data is limited to your permitted area.</p></div><MapPinned size={20} /></section>
          <section className="kpi-grid hub-kpis">
            <article className="kpi-card"><div className="kpi-icon green"><Users size={19} /></div><div className="kpi-label">Members in scope</div><strong>{summary?.members ?? "..."}</strong><span className="trend neutral">{summary ? `${summary.activeMembers} active` : "Loading authorized data"}</span></article>
            <article className="kpi-card"><div className="kpi-icon coral"><Users size={19} /></div><div className="kpi-label">Active members</div><strong>{summary?.activeMembers ?? "..."}</strong><span className="trend neutral">Current participation</span></article>
            <article className="kpi-card"><div className="kpi-icon blue"><MapPinned size={19} /></div><div className="kpi-label">Communities</div><strong>{summary?.communities ?? "..."}</strong><span className="trend neutral">Within authorized scope</span></article>
            <article className="kpi-card"><div className="kpi-icon yellow"><CalendarDays size={19} /></div><div className="kpi-label">Upcoming events</div><strong>{summary?.upcomingEvents ?? "..."}</strong><span className="trend neutral">Organization schedule</span></article>
          </section>
          <section className="dashboard-grid"><article className="panel hub-next"><div className="panel-heading"><div><h2>Next actions</h2><p>Operational areas available to this hub.</p></div><BarChart3 size={20} color="#247f65" /></div><div className="hub-action-list"><a href="/members"><Users size={17} /><span><strong>Review members</strong><small>See records inside your authorized scope.</small></span></a><a href="/communities"><MapPinned size={17} /><span><strong>Open communities</strong><small>Work with the geographic spaces assigned to you.</small></span></a><a href="/messages"><ShieldCheck size={17} /><span><strong>Open messages</strong><small>Communicate with permitted contacts and communities.</small></span></a></div></article><article className="panel"><div className="panel-heading"><div><h2>Scope control</h2><p>Every request is verified by the backend.</p></div></div><div className="scope-check"><ShieldCheck size={18} /><span><strong>{scope} access active</strong><small>Changing a URL or ID cannot expand this view.</small></span></div></article></section>
        </>
      )}
    </WorkspaceShell>
  );
}