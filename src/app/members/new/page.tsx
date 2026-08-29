"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

type GeographyOption = { id: string; name: string; code: string };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
const requestOptions = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}` } });

export default function NewMemberPage() {
	const [states, setStates] = useState<GeographyOption[]>([]);
	const [lgas, setLgas] = useState<GeographyOption[]>([]);
	const [wards, setWards] = useState<GeographyOption[]>([]);
	const [pollingUnits, setPollingUnits] = useState<GeographyOption[]>([]);
	const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", whatsappNumber: "", stateId: "", localGovernmentId: "", wardId: "", pollingUnitId: "", contactConsent: false });
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => { fetch(`${apiUrl}/v1/geography/states`, requestOptions()).then((response) => response.json()).then(setStates).catch(() => setError("Unable to load states")); }, []);
	useEffect(() => { setLgas([]); setWards([]); setPollingUnits([]); setForm((current) => ({ ...current, localGovernmentId: "", wardId: "", pollingUnitId: "" })); if (form.stateId) fetch(`${apiUrl}/v1/geography/states/${form.stateId}/lgas`, requestOptions()).then((response) => response.json()).then(setLgas); }, [form.stateId]);
	useEffect(() => { setWards([]); setPollingUnits([]); setForm((current) => ({ ...current, wardId: "", pollingUnitId: "" })); if (form.localGovernmentId) fetch(`${apiUrl}/v1/geography/lgas/${form.localGovernmentId}/wards`, requestOptions()).then((response) => response.json()).then(setWards); }, [form.localGovernmentId]);
	useEffect(() => { setPollingUnits([]); setForm((current) => ({ ...current, pollingUnitId: "" })); if (form.wardId) fetch(`${apiUrl}/v1/geography/wards/${form.wardId}/polling-units`, requestOptions()).then((response) => response.json()).then(setPollingUnits); }, [form.wardId]);

	function update(field: string, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault(); setSaving(true); setError("");
		try {
			const token = localStorage.getItem("pfm.accessToken");
			const response = await fetch(`${apiUrl}/v1/members`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...form, email: form.email || undefined, phone: form.phone || undefined, whatsappNumber: form.whatsappNumber || undefined }) });
			const body = await response.json();
			if (!response.ok) throw new Error(body.message ?? "Unable to register member");
			setMessage("Member registered successfully");
		} catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to register member"); } finally { setSaving(false); }
	}

	const select = (field: string, value: string, options: GeographyOption[], label: string, disabled = false) => <label>{label}<select required value={value} disabled={disabled} onChange={(event) => update(field, event.target.value)}><option value="">Choose {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
	return <WorkspaceShell title="New Member" subtitle="Register a member with contact consent and a precise geographic assignment."><section className="panel form-panel">{message ? <div className="success-state"><CheckCircle2 size={28} /><h2>{message}</h2><p>The member and communication preferences were saved.</p><a className="primary-button" href="/members">Return to members</a></div> : <form className="workspace-form" onSubmit={submit}><div className="form-grid"><label>First name<input required minLength={2} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label><label>Last name<input required minLength={2} value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></label><label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label><label>Phone number<input placeholder="08012345678" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label><label>WhatsApp number<input placeholder="08012345678" value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} /></label>{select("stateId", form.stateId, states, "State")}{select("localGovernmentId", form.localGovernmentId, lgas, "LGA", !form.stateId)}{select("wardId", form.wardId, wards, "Ward", !form.localGovernmentId)}{select("pollingUnitId", form.pollingUnitId, pollingUnits, "Polling unit", !form.wardId)}</div><label className="checkbox-row"><input type="checkbox" checked={form.contactConsent} onChange={(event) => update("contactConsent", event.target.checked)} />I consent to PFM contacting me through the channels provided.</label>{error && <div className="error-state"><strong>{error}</strong></div>}<div className="form-actions"><a className="secondary-button" href="/members"><ArrowLeft size={15} />Cancel</a><button className="primary-button" type="submit" disabled={saving}>{saving ? "Registering..." : "Register member"}</button></div></form>}</section></WorkspaceShell>;
}
