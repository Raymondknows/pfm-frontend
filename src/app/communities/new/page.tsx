"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, MapPinned, ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

type Option = { id: string; name: string; code: string };
const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();
const authOptions = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}`,
  },
});

export default function NewCommunityPage() {
  const [states, setStates] = useState<Option[]>([]);
  const [lgas, setLgas] = useState<Option[]>([]);
  const [wards, setWards] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    stateId: "",
    localGovernmentId: "",
    wardId: "",
    pollingUnitId: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch(`${apiUrl}/v1/geography/states`, authOptions())
      .then((response) => response.json())
      .then(setStates)
      .catch(() => setError("Unable to load geography"));
  }, []);
  useEffect(() => {
    setLgas([]);
    setWards([]);
    setUnits([]);
    setForm((current) => ({
      ...current,
      localGovernmentId: "",
      wardId: "",
      pollingUnitId: "",
    }));
    if (form.stateId)
      fetch(`${apiUrl}/v1/geography/states/${form.stateId}/lgas`, authOptions())
        .then((response) => response.json())
        .then(setLgas);
  }, [form.stateId]);
  useEffect(() => {
    setWards([]);
    setUnits([]);
    setForm((current) => ({ ...current, wardId: "", pollingUnitId: "" }));
    if (form.localGovernmentId)
      fetch(
        `${apiUrl}/v1/geography/lgas/${form.localGovernmentId}/wards`,
        authOptions(),
      )
        .then((response) => response.json())
        .then(setWards);
  }, [form.localGovernmentId]);
  useEffect(() => {
    setUnits([]);
    setForm((current) => ({ ...current, pollingUnitId: "" }));
    if (form.wardId)
      fetch(
        `${apiUrl}/v1/geography/wards/${form.wardId}/polling-units`,
        authOptions(),
      )
        .then((response) => response.json())
        .then(setUnits);
  }, [form.wardId]);
  function set(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const response = await fetch(`${apiUrl}/v1/communities`, {
      method: "POST",
      headers: { ...authOptions().headers, "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        stateId: form.stateId || undefined,
        localGovernmentId: form.localGovernmentId || undefined,
        wardId: form.wardId || undefined,
        pollingUnitId: form.pollingUnitId || undefined,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Unable to create community");
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  }
  const select = (
    field: string,
    value: string,
    label: string,
    options: Option[],
    disabled = false,
    required = false,
  ) => (
    <label>
      {label}
      <select
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => set(field, event.target.value)}
      >
        <option value="">Choose {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <WorkspaceShell
      title="New Community"
      subtitle="Create a local space for members to organize together."
    >
      <section className="panel form-panel">
        {saved ? (
          <div className="success-state community-success">
            <CheckCircle2 size={28} />
            <span className="eyebrow">Workspace updated</span>
            <h2>{form.name} is ready</h2>
            <p>Members assigned to this geography can now find the community and its conversation.</p>
            <a className="primary-button" href="/communities">
              Return to communities
            </a>
          </div>
        ) : (
          <div className="community-create-layout">
            <form className="workspace-form" onSubmit={submit}>
              <div className="form-section-heading"><span className="form-section-icon"><MapPinned size={17} /></span><div><h2>Community details</h2><p>Give this geographic space a clear identity for local members.</p></div></div>
              <label>Community name<input required minLength={2} value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Ward 04 Community" /></label>
              <label>Description<span className="field-hint">Optional context visible to members.</span><textarea rows={4} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="What is this community responsible for?" /></label>
              <div className="form-section-heading geography-heading"><span className="form-section-icon"><ShieldCheck size={17} /></span><div><h2>Geographic scope</h2><p>Choose the most specific level this community represents.</p></div></div>
              <div className="form-grid">{select("stateId", form.stateId, "State", states, false, true)}{select("localGovernmentId", form.localGovernmentId, "LGA", lgas, !form.stateId)}{select("wardId", form.wardId, "Ward", wards, !form.localGovernmentId)}{select("pollingUnitId", form.pollingUnitId, "Polling unit", units, !form.wardId)}</div>
              {error && <div className="form-error" role="alert"><strong>{error}</strong></div>}
              <div className="form-actions"><a className="secondary-button" href="/communities"><ArrowLeft size={15} />Cancel</a><button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating..." : "Create community"}</button></div>
            </form>
            <aside className="community-create-note"><span className="eyebrow">How it works</span><h2>One place, one geography.</h2><p>Members are enrolled automatically from their matching State, LGA, Ward, and Polling Unit assignments.</p><div className="scope-preview"><small>COMMUNITY SCOPE</small><strong>{form.pollingUnitId ? "Polling unit" : form.wardId ? "Ward" : form.localGovernmentId ? "LGA" : form.stateId ? "State" : "Select a location"}</strong><span>{form.pollingUnitId || form.wardId || form.localGovernmentId || form.stateId ? "Members in this geography will be connected." : "Start with a State, then narrow the scope."}</span></div></aside>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
