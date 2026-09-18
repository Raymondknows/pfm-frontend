"use client";

import { AlertCircle, ArrowUpRight, BarChart3, CalendarDays, MapPinned, ShieldCheck, Users, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

export function RoleHubDashboard({ requestedRole }: { requestedRole: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<HubSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${apiUrl}/v1/analytics/hub`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem("pfm.accessToken");
          localStorage.removeItem("pfm.refreshToken");
          localStorage.removeItem("pfm.user");
          router.push("/login");
          return null;
        }
        const body: unknown = await response.json();
        if (!response.ok || typeof body !== "object" || body === null) {
          throw new Error("Unable to load your hub dashboard");
        }
        return body as HubSummary;
      })
      .then((summary) => summary && setSummary(summary))
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your hub dashboard",
        ),
      );
  }, [router]);

  const role = summary?.role ?? requestedRole;
  const scope = summary?.scopeType?.replace("_", " ") ?? "AUTHORIZED";
  const quickActions = [
    { label: "Members", href: "/members", icon: Users, tone: "green" },
    { label: "Communities", href: "/communities", icon: MapPinned, tone: "blue" },
    { label: "Issues", href: "/issues", icon: AlertCircle, tone: "coral" },
    { label: "Reports", href: "/reports", icon: FileText, tone: "yellow" },
    { label: "Messages", href: "/messages", icon: ShieldCheck, tone: "slate" },
    { label: "Events", href: "/events", icon: CalendarDays, tone: "green" },
  ];

  return (
    <WorkspaceShell
      title={`${role} hub`}
      subtitle="A clear view of your movement work, scope, and priorities."
      hidePageHeader={true}
    >
      {error ? (
        <section className="panel page-panel">
          <div className="error-state"><strong>{error}</strong><a className="secondary-button" href="/login">Sign in again</a></div>
        </section>
      ) : (
        <>
          <section className="hub-hero">
            <div className="hub-hero-mark"><ShieldCheck size={22} /></div>
            <div className="hub-hero-copy">
              <span className="eyebrow">{scope} workspace</span>
              <h1>{role}</h1>
              <p>{summary?.scopeName ?? summary?.parentScopeName ?? "National workspace"}</p>
            </div>
            <div className="hub-hero-status"><span />Live</div>
          </section>

          <section className="kpi-grid hub-kpis">
            <article className="kpi-card">
              <div className="kpi-icon green"><Users size={19} /></div>
              <div className="kpi-label">Members</div>
              <strong>{summary?.members ?? "..."}</strong>
              <span className="trend neutral">{summary ? `${summary.activeMembers} active` : "Loading"}</span>
            </article>
            <article className="kpi-card">
              <div className="kpi-icon coral"><Users size={19} /></div>
              <div className="kpi-label">Active</div>
              <strong>{summary?.activeMembers ?? "..."}</strong>
              <span className="trend neutral">Members</span>
            </article>
            <article className="kpi-card">
              <div className="kpi-icon blue"><MapPinned size={19} /></div>
              <div className="kpi-label">Communities</div>
              <strong>{summary?.communities ?? "..."}</strong>
              <span className="trend neutral">In scope</span>
            </article>
            <article className="kpi-card">
              <div className="kpi-icon yellow"><CalendarDays size={19} /></div>
              <div className="kpi-label">Events</div>
              <strong>{summary?.upcomingEvents ?? "..."}</strong>
              <span className="trend neutral">Upcoming</span>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel hub-scope-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Access</span>
                  <h2>Workspace scope</h2>
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
              </div>
            </article>

            <article className="panel hub-next">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Shortcuts</span>
                  <h2>Quick actions</h2>
                </div>
                <BarChart3 size={20} color="#247f65" />
              </div>
              <div className="hub-action-list">
                {quickActions.map(({ label, href, icon: Icon, tone }) => (
                  <a href={href} key={label} className="hub-action-card">
                    <span className={`hub-action-icon ${tone}`}><Icon size={17} /></span>
                    <strong>{label}</strong>
                    <ArrowUpRight size={15} />
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