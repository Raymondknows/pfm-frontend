"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPinned,
} from "lucide-react";

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [organizationSlug, setOrganizationSlug] = useState(
    "peoples-first-movement",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, organizationSlug }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Unable to sign in");
      localStorage.setItem("pfm.accessToken", body.accessToken);
      localStorage.setItem("pfm.refreshToken", body.refreshToken);
      localStorage.setItem("pfm.user", JSON.stringify(body.user));
      const primaryRole = body.user?.roles?.[0]?.name?.toLowerCase();
      const dashboard =
        primaryRole === "member"
          ? "/dashboard/member"
          : primaryRole === "candidate"
            ? "/dashboard/candidate"
            : primaryRole === "admin" || primaryRole === "super admin" || primaryRole === "super-admin"
              ? "/dashboard/admin"
              : primaryRole?.includes("state")
                ? "/dashboard/state"
                : primaryRole?.includes("lga")
                  ? "/dashboard/lga"
                  : primaryRole?.includes("ward")
                    ? "/dashboard/ward"
                    : primaryRole?.includes("polling")
                      ? "/dashboard/polling-unit"
                      : primaryRole?.includes("community")
                        ? "/dashboard/community"
                        : "/";
      window.location.href = dashboard;
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to sign in",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-aside">
        <div className="brand login-brand">
          <span className="brand-mark">P</span>
          <span>People&apos;s First Movement</span>
        </div>
        <p className="program-name">Adebutu Voters Engagement Program</p>
        <div className="login-aside-copy">
          <p className="eyebrow">Movement workspace</p>
          <h1>
            Organize locally.
            <br />
            Move together.
          </h1>
          <p>
            One clear view of your people, places, and progress across Ogun
            State.
          </p>
          <div className="login-stat">
            <MapPinned size={18} />
            <span>
              <strong>Ogun State</strong>
              <small>20 LGAs · 236 wards · 3,213 polling units</small>
            </span>
          </div>
        </div>
      </div>
      <section className="login-card">
        <div className="login-card-heading">
          <div className="login-icon">
            <LockKeyhole size={19} />
          </div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to PFM</h2>
          <p>Use your organization account to continue.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <span className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>
          <label>
            Password
            <span className="input-wrap">
              <LockKeyhole size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <label>
            Organization
            <span className="input-wrap">
              <MapPinned size={16} />
              <input
                value={organizationSlug}
                onChange={(event) => setOrganizationSlug(event.target.value)}
                required
              />
            </span>
          </label>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="login-footer">
          New member? <a href="/register">Register here</a>
          <br />
          Your access is determined by your role and geographic scope.
        </p>
      </section>
    </main>
  );
}
