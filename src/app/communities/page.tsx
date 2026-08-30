"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPinned, Plus, Search, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { useHasPermission } from "@/components/workspace-navigation";

type Community = {
  id: string;
  name: string;
  description: string | null;
  type: "STATE" | "LGA" | "WARD" | "POLLING_UNIT";
  status: "ACTIVE" | "ARCHIVED";
  state: { name: string } | null;
  localGovernment: { name: string } | null;
  ward: { name: string } | null;
  _count: { members: number };
};
const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

export default function CommunitiesPage() {
  const canWriteCommunities = useHasPermission("communities:write");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${apiUrl}/v1/communities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !Array.isArray(body))
          throw new Error("Unable to load communities");
        return body as Community[];
      })
      .then(setCommunities)
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load communities",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const visibleCommunities = communities.filter((community) => {
    const matchesType = filter === "ALL" || community.type === filter;
    const searchText = `${community.name} ${community.description ?? ""} ${community.ward?.name ?? ""} ${community.localGovernment?.name ?? ""} ${community.state?.name ?? ""}`.toLowerCase();
    return matchesType && searchText.includes(query.trim().toLowerCase());
  });
  const totalMembers = communities.reduce((total, community) => total + community._count.members, 0);
  return (
    <WorkspaceShell
      title="Communities"
      subtitle="Create trusted spaces for local organizing and collaboration."
      action={canWriteCommunities ? (
        <Link className="primary-button" href="/communities/new">
          <Plus size={17} />
          New community
        </Link>
      ) : undefined}
    >
      <section className="community-overview">
        <div className="community-summary">
          <div className="summary-icon"><MapPinned size={20} /></div>
          <div><span className="eyebrow">Authorized geography</span><strong>Community network</strong><p>Manage the local spaces available within your role and geographic scope.</p></div>
        </div>
        <div className="summary-metrics"><div><strong>{communities.length}</strong><span>Communities</span></div><div><strong>{totalMembers}</strong><span>Members connected</span></div><div><strong>{communities.filter(({ type }) => type === "POLLING_UNIT").length}</strong><span>Polling units</span></div></div>
      </section>
      <section className="panel page-panel">
        <div className="panel-heading">
          <div>
            <h2>Community spaces</h2>
            <p>Local spaces for members to connect and organize.</p>
          </div>
          <span className="status-badge">{visibleCommunities.length} of {communities.length}</span>
        </div>
        <div className="community-toolbar"><label className="community-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by community or location" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter communities"><option value="ALL">All levels</option><option value="STATE">State</option><option value="LGA">LGA</option><option value="WARD">Ward</option><option value="POLLING_UNIT">Polling unit</option></select></div>
        {loading ? (
          <div className="loading-state">Loading communities...</div>
        ) : error ? (
          <div className="error-state">
            <strong>{error}</strong>
            <a className="secondary-button" href="/login">
              Sign in again
            </a>
          </div>
        ) : communities.length === 0 ? (
          <div className="empty-state">
            <h2>No communities yet</h2>
            <p>Create the first community space for your organization.</p>
            {canWriteCommunities && <Link className="primary-button" href="/communities/new">
              Create community
            </Link>}
          </div>
        ) : (
          <div className="community-grid">
            {visibleCommunities.map((community) => (
              <Link
                className="community-card"
                href={`/communities/${community.id}`}
                key={community.id}
              >
                <div className="community-card-top"><span className="community-type">{community.type.replace("_", " ")}</span><ArrowUpRight size={17} /></div>
                <div className="community-card-copy">
                  <h3>{community.name}</h3>
                  <p>{community.description ?? "No description"}</p>
                </div>
                <div className="community-card-meta"><span>
                  <Users size={15} />
                  {community._count.members} members
                </span>
                <small>
                  {community.ward?.name ??
                    community.localGovernment?.name ??
                    community.state?.name ??
                    "Organization-wide"}
                </small>
                  </div>
                </Link>
            ))}
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
