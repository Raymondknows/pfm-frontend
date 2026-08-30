"use client";

import { useEffect, useState } from "react";

type Member = { id: string; userId: string | null; status: string; stateId: string | null; localGovernmentId: string | null; wardId: string | null; pollingUnitId: string | null; communities: Array<{ communityId: string; community: { name: string } }> };
type Role = { id: string; name: string; scopeType: string };
const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function MemberActions({ member, onChange }: { member: Member; onChange: () => void }) {
  const [roles, setRoles] = useState<Role[]>([]); const [roleId, setRoleId] = useState(""); const [error, setError] = useState("");
  useEffect(() => { const token = localStorage.getItem("pfm.accessToken"); fetch(`${apiUrl}/v1/roles`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : []).then(setRoles).catch(() => undefined); }, []);
  async function approve() { const token = localStorage.getItem("pfm.accessToken"); const response = await fetch(`${apiUrl}/v1/members/${member.id}/approve`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: "ACTIVE" }) }); if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.message ?? "Unable to approve member"); return; } onChange(); }
  async function assign() { if (!member.userId || !roleId) return; const selectedRole = roles.find((role) => role.id === roleId); const scopeId = selectedRole?.scopeType === "STATE" ? member.stateId : selectedRole?.scopeType === "LGA" ? member.localGovernmentId : selectedRole?.scopeType === "WARD" ? member.wardId : selectedRole?.scopeType === "POLLING_UNIT" ? member.pollingUnitId : selectedRole?.scopeType === "COMMUNITY" ? member.communities[0]?.communityId : undefined; const isOrganizationRole = selectedRole?.scopeType === "ORGANIZATION"; if (!isOrganizationRole && (!scopeId || !uuidPattern.test(scopeId))) { setError("This member has no valid scope for that role"); return; } const token = localStorage.getItem("pfm.accessToken"); const payload = isOrganizationRole ? { roleId } : { roleId, scopeId }; const response = await fetch(`${apiUrl}/v1/roles/users/${member.userId}`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }); if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.message ?? "Unable to assign role"); return; } setError("Role assigned"); }
  return <div className="member-actions">{member.status === "PENDING" && <button className="small-action" type="button" onClick={approve}>Approve</button>}{member.userId && <><select aria-label="Role to assign" value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="">Assign role</option>{roles.filter((role) => role.name !== "Member").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{roleId && <button className="small-action" type="button" onClick={assign}>Assign</button>}</>}{error && <small>{error}</small>}</div>;
}