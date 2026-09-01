"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";

interface CreateIssueFormProps {
  onSuccess?: () => void;
}

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

export function CreateIssueForm({ onSuccess }: CreateIssueFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "INFRASTRUCTURE" as "INFRASTRUCTURE" | "SECURITY" | "COMMUNITY" | "MEMBERSHIP" | "OTHER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/v1/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.status === 401) {
        localStorage.removeItem("pfm.accessToken");
        localStorage.removeItem("pfm.refreshToken");
        localStorage.removeItem("pfm.user");
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || "Failed to create issue");
      }

      setSuccess(true);
      onSuccess?.();

      setTimeout(() => {
        router.push("/issues");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-success">
        <CheckCircle size={48} className="success-icon" />
        <h2>Issue created successfully</h2>
        <p>Redirecting to issues list...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      {error && (
        <div className="form-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Issue title <span className="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          placeholder="Brief description of the issue"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="form-input"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="category" className="form-label">
          Category <span className="required">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value as
                | "INFRASTRUCTURE"
                | "SECURITY"
                | "COMMUNITY"
                | "MEMBERSHIP"
                | "OTHER",
            })
          }
          className="form-select"
          disabled={loading}
        >
          <option value="INFRASTRUCTURE">Infrastructure</option>
          <option value="SECURITY">Security</option>
          <option value="COMMUNITY">Community</option>
          <option value="MEMBERSHIP">Membership</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          required
          placeholder="Detailed description of the issue"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="form-textarea"
          rows={6}
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={() => router.back()}
          className="secondary-button"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Creating..." : "Create issue"}
        </button>
      </div>

      <style jsx>{`
        .issue-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 600px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }

        .required {
          color: #dc2626;
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
        }

        .form-input:disabled,
        .form-select:disabled,
        .form-textarea:disabled {
          background: #f9f9f9;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #fee2e2;
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: #991b1b;
          font-size: 0.9rem;
        }

        .form-error svg {
          flex-shrink: 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .form-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          text-align: center;
        }

        .success-icon {
          color: #16a34a;
        }

        .form-success h2 {
          margin: 0;
          color: #16a34a;
        }

        .form-success p {
          margin: 0;
          color: #666;
        }

        @media (max-width: 640px) {
          .form-actions {
            flex-direction: column-reverse;
            gap: 0.75rem;
          }

          .form-actions button {
            width: 100%;
          }

          .issue-form {
            max-width: 100%;
          }
        }
      `}</style>
    </form>
  );
}
