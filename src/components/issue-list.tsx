"use client";

import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Zap, Users, MapPin, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionHandler } from "@/lib/session";

type Issue = {
  id: string;
  title: string;
  description: string;
  category: "INFRASTRUCTURE" | "SECURITY" | "COMMUNITY" | "MEMBERSHIP" | "OTHER";
  status: "OPEN" | "REVIEWING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  state?: { name: string };
  localGovernment?: { name: string };
  ward?: { name: string };
  pollingUnit?: { name: string };
  reporter?: { id: string; firstName: string; lastName: string };
  assignee?: { id: string; firstName: string; lastName: string };
};

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

const categoryIcons: Record<Issue["category"], React.ReactNode> = {
  INFRASTRUCTURE: <Zap size={15} className="issue-category-icon infrastructure" />,
  SECURITY: <AlertTriangle size={15} className="issue-category-icon security" />,
  COMMUNITY: <Users size={15} className="issue-category-icon community" />,
  MEMBERSHIP: <Users size={15} className="issue-category-icon membership" />,
  OTHER: <AlertCircle size={15} className="issue-category-icon other" />,
};

const statusBadges: Record<Issue["status"], { label: string; className: string; icon: React.ReactNode }> = {
  OPEN: { label: "Open", className: "badge-open", icon: <AlertCircle size={12} /> },
  REVIEWING: { label: "Reviewing", className: "badge-reviewing", icon: <Clock size={12} /> },
  ASSIGNED: { label: "Assigned", className: "badge-assigned", icon: <Users size={12} /> },
  IN_PROGRESS: { label: "In Progress", className: "badge-progress", icon: <Clock size={12} /> },
  RESOLVED: { label: "Resolved", className: "badge-resolved", icon: <CheckCircle2 size={12} /> },
  CLOSED: { label: "Closed", className: "badge-closed", icon: <CheckCircle2 size={12} /> },
};

export function IssueList() {
  const router = useRouter();
  const { handleUnauthorizedResponse } = useSessionHandler();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<{ status?: string; category?: string }>({});

  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.category) params.append("category", filters.category);

    setLoading(true);
    fetch(`${apiUrl}/v1/issues${params.size > 0 ? `?${params}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("pfm.accessToken");
          localStorage.removeItem("pfm.refreshToken");
          localStorage.removeItem("pfm.user");
          router.push("/login");
          return [];
        }
        if (!res.ok) throw new Error("Failed to load issues");
        return (await res.json()) as Issue[];
      })
      .then((issues) => setIssues(issues))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load issues"),
      )
      .finally(() => setLoading(false));
  }, [filters]);

  const getLocationDisplay = (issue: Issue) => {
    if (issue.pollingUnit) return issue.pollingUnit.name;
    if (issue.ward) return issue.ward.name;
    if (issue.localGovernment) return issue.localGovernment.name;
    if (issue.state) return issue.state.name;
    return "Unscoped";
  };

  return (
    <div className="issues-container">
      <div className="issues-toolbar">
        <div className="filter-group">
          <select
            value={filters.status || ""}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filters.category || ""}
            onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">All categories</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="SECURITY">Security</option>
            <option value="COMMUNITY">Community</option>
            <option value="MEMBERSHIP">Membership</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <Link href="/issues/new" className="primary-button">
          + New issue
        </Link>
      </div>

      {error && (
        <section className="panel page-panel">
          <div className="error-state">
            <strong>{error}</strong>
          </div>
        </section>
      )}

      {loading ? (
        <section className="panel page-panel">
          <div className="loading-state">Loading issues...</div>
        </section>
      ) : issues.length === 0 ? (
        <section className="panel page-panel">
          <div className="empty-state">
            <AlertCircle size={24} />
            <p>No issues found</p>
            <Link href="/issues/new" className="secondary-button">
              Create one now
            </Link>
          </div>
        </section>
      ) : (
        <div className="issues-list">
          {issues.map((issue) => {
            const badge = statusBadges[issue.status];
            return (
              <article key={issue.id} className="issue-card">
                <div className="issue-header">
                  <div className="issue-title-group">
                    <h3 className="issue-title">{issue.title}</h3>
                    <div className="issue-meta">
                      <span className="category-badge">
                        {categoryIcons[issue.category]}
                        {issue.category.replace(/_/g, " ")}
                      </span>
                      <span className={`status-badge ${badge.className}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <time className="issue-date">{new Date(issue.createdAt).toLocaleDateString()}</time>
                </div>

                <p className="issue-description">{issue.description}</p>

                <div className="issue-footer">
                  <div className="issue-details">
                      <span className="detail"><MapPin size={14} />{getLocationDisplay(issue)}</span>
                    {issue.assignee && (
                        <span className="detail"><UserRound size={14} />{issue.assignee.firstName} {issue.assignee.lastName}</span>
                    )}
                    {issue.reporter && (
                      <span className="detail detail-secondary">
                        Reported by {issue.reporter.firstName}
                      </span>
                    )}
                  </div>
                  <Link href={`/issues/${issue.id}`} className="secondary-button small">
                    View
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .issues-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .issues-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--line);
          border-radius: 7px;
          font-size: 12px;
          color: var(--ink);
          background: #fff;
          cursor: pointer;
        }

        .filter-select:hover {
          border-color: #a8cfbd;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .issue-card {
          border: 1px solid var(--line);
          border-radius: 9px;
          padding: 16px;
          background: #fff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .issue-card:hover {
          border-color: #b6d7c7;
          box-shadow: 0 9px 22px #183b3510;
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .issue-title-group {
          flex: 1;
        }

        .issue-title {
          margin: 0;
          font: 600 15px var(--font-display);
          color: var(--ink);
        }

        .issue-meta {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .category-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .category-badge {
          background: #edf2ef;
          color: #5d716a;
        }

        .badge-open {
          background: #fbe8e4;
          color: #a4483d;
        }

        .badge-reviewing {
          background: #fbf2d6;
          color: #9a7626;
        }

        .badge-assigned {
          background: #e5eff7;
          color: #4d7da0;
        }

        .badge-progress {
          background: #e3f2eb;
          color: #277b62;
        }

        .badge-resolved {
          background: #e3f2eb;
          color: #277b62;
        }

        .badge-closed {
          background: #edf2ef;
          color: #64766f;
        }

        .issue-date {
          font-size: 10px;
          color: var(--muted);
          white-space: nowrap;
        }

        .issue-description {
          margin: 0 0 0.75rem 0;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.55;
        }

        .issue-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .issue-details {
          display: flex;
          gap: 12px;
          font-size: 11px;
          flex-wrap: wrap;
        }

        .detail {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--muted);
        }

        .detail-secondary {
          color: #879891;
          font-size: 10px;
        }

        .loading-state,
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--muted);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .error-state {
          padding: 1rem;
          background: #fbe8e4;
          border: 1px solid #edc3bb;
          border-radius: 7px;
          color: #a4483d;
        }

        @media (max-width: 640px) {
          .issues-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
            flex-direction: column;
          }

          .filter-select {
            width: 100%;
          }

          .primary-button {
            width: 100%;
            text-align: center;
          }

          .issue-header {
            flex-direction: column;
          }

          .issue-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .secondary-button.small {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
