"use client";

import { AlertCircle, BarChart3, CalendarDays, MapPinned, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";

type HubSummary = {
  role: string;
  scopeType: string;
  scopeName?: string;
  members: number;
  activeMembers: number;
  communities: number;
  upcomingEvents: number;
  parentScope?: string;
  parentScopeName?: string;
};

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

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
  const quickActions = [
    { label: "Review members", href: "/members", icon: Users },
    { label: "Open communities", href: "/communities", icon: MapPinned },
    { label: "Report issue", href: "/issues", icon: AlertCircle },
    { label: "Open messages", href: "/messages", icon: ShieldCheck },
    { label: "View notifications", href: "/notifications", icon: CalendarDays },
  ];

  return (
    <WorkspaceShell
      title={`${role} hub`}
      subtitle="A clear view of your movement work, scope, and priorities."
    >
      {error ? (
        <section className="panel page-panel">
          <div className="error-state"><strong>{error}</strong><a className="secondary-button" href="/login">Sign in again</a></div>
        </section>
      ) : (
        <>
          <section className="hub-banner">
            <div className="hub-banner-icon"><ShieldCheck size={22} /></div>
            <div>
              <span className="eyebrow">Authorized hub</span>
              <h2>{role}</h2>
              <p>{scope} scope · Your workspace is limited to the people and places you are allowed to manage.</p>
            </div>
            <MapPinned size={20} />
          </section>

          <section className="kpi-grid hub-kpis">
            <article className="kpi-card">
              <div className="kpi-icon green"><Users size={19} /></div>
              <div className="kpi-label">Members in scope</div>
              <strong>{summary?.members ?? "..."}</strong>
              <span className="trend neutral">{summary ? `${summary.activeMembers} active` : "Loading"}</span>
            </article>
            <article className="kpi-card">
              <div className="kpi-icon coral"><Users size={19} /></div>
              <div className="kpi-label">Active members</div>
              <strong>{summary?.activeMembers ?? "..."}</strong>
              <span className="trend neutral">Current participation</span>
            </article>
            <article className="kpi-card">
              <div className="kpi-icon blue"><MapPinned size={19} /></div>
              <div className="kpi-label">Communities</div>
              <strong>{summary?.communities ?? "..."}</strong>
              <span className="trend neutral">Within scope</span>
            </article>
            <article className="kpi-card">
              <div className="kpi-icon yellow"><CalendarDays size={19} /></div>
              <div className="kpi-label">Upcoming events</div>
              <strong>{summary?.upcomingEvents ?? "..."}</strong>
              <span className="trend neutral">Planned actions</span>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <h2>My scope</h2>
                  <p>Your operating area and authority level.</p>
                </div>
                <MapPinned size={20} color="#247f65" />
              </div>
              <div className="scope-details">
                <div className="scope-item">
                  <small className="scope-label">Role level</small>
                  <strong>{scope}</strong>
                </div>
                {summary?.parentScopeName && (
                  <div className="scope-item">
                    <small className="scope-label">Within {summary.parentScope?.replace("_", " ")}</small>
                    <strong>{summary.parentScopeName}</strong>
                  </div>
                )}
                {summary?.scopeName && (
                  <div className="scope-item">
                    <small className="scope-label">Your {scope.toLowerCase()}</small>
                    <strong>{summary.scopeName}</strong>
                  </div>
                )}
                <div className="scope-item">
                  <small className="scope-label">Authorization</small>
                  <strong>Scope-limited access</strong>
                </div>
              </div>
              <small className="scope-note">You can only access people, places, and information within your assigned scope.</small>
            </article>

            <article className="panel hub-next">
              <div className="panel-heading">
                <div>
                  <h2>Quick actions</h2>
                  <p>Most common tasks for your current role.</p>
                </div>
                <BarChart3 size={20} color="#247f65" />
              </div>
              <div className="hub-action-list">
                {quickActions.map(({ label, href, icon: Icon }) => (
                  <a href={href} key={label}>
                    <Icon size={17} />
                    <span>
                      <strong>{label}</strong>
                      <small>Open the relevant workspace for {label.toLowerCase()}.</small>
                    </span>
                  </a>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}