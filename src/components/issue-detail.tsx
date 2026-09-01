"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, Clock, AlertTriangle, Zap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
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
  OPEN: { label: "Open", className: "badge-open", icon: <AlertCircle size={14} /> },
  REVIEWING: { label: "Reviewing", className: "badge-reviewing", icon: <Clock size={14} /> },
  ASSIGNED: { label: "Assigned", className: "badge-assigned", icon: <Users size={14} /> },
  IN_PROGRESS: { label: "In Progress", className: "badge-progress", icon: <Clock size={14} /> },
  RESOLVED: { label: "Resolved", className: "badge-resolved", icon: <CheckCircle2 size={14} /> },
  CLOSED: { label: "Closed", className: "badge-closed", icon: <CheckCircle2 size={14} /> },
};

const statusOptions = ["OPEN", "REVIEWING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export function IssueDetail() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    fetch(`${apiUrl}/v1/issues/${issueId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("pfm.accessToken");
          localStorage.removeItem("pfm.refreshToken");
          localStorage.removeItem("pfm.user");
          router.push("/login");
          return null;
        }
        if (!res.ok) throw new Error("Failed to load issue");
        return (await res.json()) as Issue;
      })
      .then((issue) => issue && setIssue(issue))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load issue"),
      )
      .finally(() => setLoading(false));
  }, [issueId, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;

    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`${apiUrl}/v1/issues/${issueId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setIssue({ ...issue, status: newStatus as Issue["status"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getLocationDisplay = (issue: Issue) => {
    if (issue.pollingUnit) return issue.pollingUnit.name;
    if (issue.ward) return issue.ward.name;
    if (issue.localGovernment) return issue.localGovernment.name;
    if (issue.state) return issue.state.name;
    return "Unscoped";
  };

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-state">Loading issue...</div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="detail-container">
        <div className="error-state">
          <strong>{error || "Issue not found"}</strong>
          <Link href="/issues" className="secondary-button">
            Back to issues
          </Link>
        </div>
      </div>
    );
  }

  const badge = statusBadges[issue.status];

  return (
    <div className="detail-container">
      <button onClick={() => router.back()} className="back-button">
        <ArrowLeft size={18} /> Back
      </button>

      <article className="issue-detail">
        <div className="detail-header">
          <div className="header-main">
            <h1 className="issue-title">{issue.title}</h1>
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

        <section className="detail-section">
          <h2 className="section-title">Description</h2>
          <p className="description-text">{issue.description}</p>
        </section>

        <section className="detail-section">
          <h2 className="section-title">Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">📍 {getLocationDisplay(issue)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{issue.category.replace(/_/g, " ")}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <div className="status-selector">
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="status-select"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {issue.assignee && (
              <div className="detail-item">
                <span className="detail-label">Assigned to</span>
                <span className="detail-value">
                  👤 {issue.assignee.firstName} {issue.assignee.lastName}
                </span>
              </div>
            )}
            {issue.reporter && (
              <div className="detail-item">
                <span className="detail-label">Reported by</span>
                <span className="detail-value">
                  {issue.reporter.firstName} {issue.reporter.lastName}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Last updated</span>
              <span className="detail-value">{new Date(issue.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </section>

        <div className="detail-actions">
          <Link href="/issues" className="secondary-button">
            Back to all issues
          </Link>
        </div>
      </article>

      <style jsx>{`
        .detail-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 0.9rem;
          width: fit-content;
          transition: background 0.2s;
        }

        .back-button:hover {
          background: #f9f9f9;
        }

        .issue-detail {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 2rem;
          background: white;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .header-main {
          flex: 1;
        }

        .issue-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }

        .issue-meta {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .category-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
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
          font-size: 0.85rem;
          color: #999;
          white-space: nowrap;
        }

        .detail-section {
          margin-bottom: 2rem;
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
        }

        .description-text {
          margin: 0;
          font-size: 0.95rem;
          color: #555;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-label {
          font-size: 0.8rem;
          color: #999;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
        }

        .status-selector {
          display: flex;
          gap: 0.5rem;
        }

        .status-select {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .status-select:hover {
          border-color: #999;
        }

        .status-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .detail-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e0e0e0;
        }

        .loading-state,
        .error-state {
          padding: 2rem;
          text-align: center;
          color: #666;
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          background: #fee2e2;
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: #991b1b;
        }

        @media (max-width: 640px) {
          .issue-detail {
            padding: 1rem;
          }

          .detail-header {
            flex-direction: column;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .back-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
