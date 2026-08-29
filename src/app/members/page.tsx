"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { MemberActions } from "@/components/member-actions";

type Member = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  status: string;
  stateId: string | null;
  localGovernmentId: string | null;
  wardId: string | null;
  pollingUnitId: string | null;
  communities: Array<{ communityId: string; community: { name: string } }>;
  state: { name: string } | null;
  localGovernment: { name: string } | null;
  ward: { name: string } | null;
};
type MemberResponse = {
  data: Member[];
  meta: { page: number; total: number; totalPages: number };
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MemberResponse["meta"]>({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    fetch(
      `http://localhost:3002/api/v1/members?page=${page}&limit=25&search=${encodeURIComponent(search)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then(async (response) => {
        const body: unknown = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("pfm.accessToken");
          localStorage.removeItem("pfm.refreshToken");
          window.location.href = "/login";
          return null;
        }
        if (
          !response.ok ||
          typeof body !== "object" ||
          body === null ||
          !("data" in body) ||
          !Array.isArray(body.data)
        )
          throw new Error("Unable to load the member directory");
        return body as MemberResponse;
      })
      .then((body) => {
        if (body) {
          setMembers(body.data);
          setMeta(body.meta);
        }
      })
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the member directory",
        ),
      )
      .finally(() => setLoading(false));
  }, [page, search]);
  return (
    <WorkspaceShell
      title="Members"
      subtitle="Manage your movement membership and geographic assignments."
      action={
        <a className="primary-button" href="/members/new">
          <UserPlus size={17} />
          Add member
        </a>
      }
    >
      <section className="panel page-panel">
        <div className="panel-heading">
          <div>
            <h2>Member directory</h2>
            <p>View and manage your organization&apos;s members.</p>
          </div>
          <span className="status-badge">{meta.total} members</span>
        </div>
        <form
          className="member-search"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
          }}
        >
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search members, email, or phone"
          />
        </form>
        {loading ? (
          <div className="loading-state">Loading member directory...</div>
        ) : error ? (
          <div className="error-state">
            <strong>{error}</strong>
            <a className="secondary-button" href="/login">
              Sign in again
            </a>
          </div>
        ) : (
          <>
            <div className="member-table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Status and actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>
                          {member.firstName} {member.lastName}
                        </strong>
                        <small>{member.email ?? "No email"}</small>
                      </td>
                      <td>
                        <strong>{member.phone ?? "No phone"}</strong>
                        <small>
                          {member.whatsappNumber
                            ? `WhatsApp: ${member.whatsappNumber}`
                            : "No WhatsApp"}
                        </small>
                      </td>
                      <td>
                        <strong>{member.ward?.name ?? "Unassigned"}</strong>
                        <small>
                          {member.localGovernment?.name ??
                            member.state?.name ??
                            "Ogun"}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`member-status ${member.status.toLowerCase()}`}
                        >
                          {member.status}
                        </span>
                        <MemberActions
                          member={member}
                          onChange={() => setPage(page)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </WorkspaceShell>
  );
}
