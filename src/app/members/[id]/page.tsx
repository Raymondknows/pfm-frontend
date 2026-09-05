"use client";

import { ArrowLeft, Mail, MapPinned, Phone, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();
type Member = { firstName: string; lastName: string; email: string | null; phone: string | null; whatsappNumber: string | null; status: string; state: { name: string } | null; localGovernment: { name: string } | null; ward: { name: string } | null; pollingUnit: { name: string } | null; communicationPreferences: Array<{ channel: string; optedIn: boolean }>; consents: Array<{ purpose: string; granted: boolean; capturedAt: string }> };

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${apiUrl}/v1/members/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}` } })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Member could not be loaded"); return body as Member; })
      .then(setMember)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Member could not be loaded"));
  }, [id]);
  return <WorkspaceShell title="Member details" subtitle="Review the member record and communication consent." hidePageHeader><section className="panel member-detail-panel">{error ? <div className="error-state">{error}</div> : !member ? <div className="loading-state">Loading member details...</div> : <><div className="member-detail-head"><div className="member-detail-avatar"><UserRound size={25} /></div><div><span className="eyebrow">Member profile</span><h1>{member.firstName} {member.lastName}</h1><span className={`member-status ${member.status.toLowerCase()}`}>{member.status}</span></div><a className="secondary-button" href="/geography"><ArrowLeft size={15} />Back to geography</a></div><div className="member-detail-grid"><article><h2>Contact</h2><p><Mail size={15} />{member.email ?? "No email"}</p><p><Phone size={15} />{member.phone ?? "No phone"}</p><p><Phone size={15} />WhatsApp: {member.whatsappNumber ?? "Not provided"}</p></article><article><h2>Geographic assignment</h2><p><MapPinned size={15} />{member.state?.name ?? "Unassigned"}</p><p>{member.localGovernment?.name ?? "LGA not assigned"}</p><p>{member.ward?.name ?? "Ward not assigned"}</p><p>{member.pollingUnit?.name ?? "Polling unit not assigned"}</p></article><article><h2>Communication consent</h2>{member.communicationPreferences.map((preference) => <p key={preference.channel}>{preference.channel}: {preference.optedIn ? "Opted in" : "Opted out"}</p>)}{member.consents[0] && <small>Consent captured {new Date(member.consents[0].capturedAt).toLocaleDateString()}</small>}</article></div></>}</section></WorkspaceShell>;
}
