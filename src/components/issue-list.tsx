"use client";

import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Zap, Users } from "lucide-react";
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
  INFRASTRUCTURE: <Zap size={16} className="text-yellow-600" />,
  SECURITY: <AlertTriangle size={16} className="text-red-600" />,
  COMMUNITY: <Users size={16} className="text-blue-600" />,
  MEMBERSHIP: <Users size={16} className="text-green-600" />,
  OTHER: <AlertCircle size={16} className="text-gray-600" />,
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
                    <span className="detail">📍 {getLocationDisplay(issue)}</span>
                    {issue.assignee && (
                      <span className="detail">
                        👤 {issue.assignee.firstName} {issue.assignee.lastName}
                      </span>
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
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .filter-select:hover {
          border-color: #999;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .issue-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          background: white;
          transition: box-shadow 0.2s;
        }

        .issue-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
          font-size: 1rem;
          font-weight: 600;
          color: #333;
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
          background: #f0f0f0;
          color: #666;
        }

        .badge-open {
          background: #fee2e2;
          color: #dc2626;
        }

        .badge-reviewing {
          background: #fef08a;
          color: #ca8a04;
        }

        .badge-assigned {
          background: #dbeafe;
          color: #0284c7;
        }

        .badge-progress {
          background: #e0e7ff;
          color: #4f46e5;
        }

        .badge-resolved {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge-closed {
          background: #f3f4f6;
          color: #6b7280;
        }

        .issue-date {
          font-size: 0.75rem;
          color: #999;
          white-space: nowrap;
        }

        .issue-description {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          color: #555;
          line-height: 1.4;
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
          gap: 1rem;
          font-size: 0.85rem;
          flex-wrap: wrap;
        }

        .detail {
          color: #666;
        }

        .detail-secondary {
          color: #999;
          font-size: 0.8rem;
        }

        .loading-state,
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .error-state {
          padding: 1rem;
          background: #fee2e2;
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: #991b1b;
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
