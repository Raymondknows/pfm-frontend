"use client";

import { useEffect, useState } from "react";
import { ChevronDown, MapPinned, UserRound } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

type Option = { id: string; name: string; code: string };
type Member = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; whatsappNumber: string | null; status: string; state: { name: string } | null; localGovernment: { name: string } | null; ward: { name: string } | null; pollingUnit: { name: string } | null };
const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();
const api = `${apiUrl}/v1/geography`;
const requestOptions = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}`,
  },
});

async function fetchOptions(url: string): Promise<Option[]> {
  const response = await fetch(url, requestOptions());
  const body: unknown = await response.json();
  if (!response.ok || !Array.isArray(body)) {
    throw new Error("Unable to load geographic options");
  }
  return body as Option[];
}

function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="geo-select">
      <span>{label}</span>
      <span className="geo-select-wrap">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {(Array.isArray(options) ? options : []).map((option) => (
            <option value={option.id} key={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </span>
    </label>
  );
}

export default function GeographyPage() {
  const [states, setStates] = useState<Option[]>([]);
  const [lgas, setLgas] = useState<Option[]>([]);
  const [wards, setWards] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [state, setState] = useState("");
  const [ogunStateId, setOgunStateId] = useState("");
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [unit, setUnit] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  
  useEffect(() => {
    fetchOptions(`${api}/states`)
      .then((loadedStates) => {
        setStates(loadedStates);
        // Find and set Ogun State as permanent
        const ogun = loadedStates.find((s) => s.name.toLowerCase().includes("ogun"));
        if (ogun) {
          setOgunStateId(ogun.id);
          setState(ogun.id);
        }
      })
      .catch(() => setStates([]));
  }, []);
  
  useEffect(() => {
    if (state)
      fetchOptions(`${api}/states/${state}/lgas`)
        .then(setLgas);
  }, [state]);
  
  useEffect(() => {
    if (lga)
      fetchOptions(`${api}/lgas/${lga}/wards`)
        .then(setWards);
  }, [lga]);
  
  useEffect(() => {
    if (ward)
      fetchOptions(`${api}/wards/${ward}/polling-units`)
        .then(setUnits);
  }, [ward]);

  useEffect(() => {
    if (!state) return;
    setMembersLoading(true);
    setMembersError("");
    const params = new URLSearchParams({ page: "1", limit: "100", stateId: state });
    if (lga) params.set("localGovernmentId", lga);
    if (ward) params.set("wardId", ward);
    if (unit) params.set("pollingUnitId", unit);
    fetch(`${apiUrl}/v1/members?${params.toString()}`, requestOptions())
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.data)) throw new Error("Unable to load members for this geography");
        return body.data as Member[];
      })
      .then(setMembers)
      .catch((error: unknown) => setMembersError(error instanceof Error ? error.message : "Unable to load members for this geography"))
      .finally(() => setMembersLoading(false));
  }, [state, lga, ward, unit]);
  
  const selectedUnit = units.find((option) => option.id === unit);
  const ogunState = states.find((s) => s.id === ogunStateId);
  
  function selectLga(value: string) {
    setLga(value);
    setWards([]); setUnits([]);
    setWard(""); setUnit("");
  }
  
  function selectWard(value: string) {
    setWard(value);
    setUnits([]); setUnit("");
  }
  return (
    <WorkspaceShell
      title="Geography"
      subtitle="Choose a precise Ogun location for membership and coordination."
    >
      <section className="panel page-panel">
        <div className="panel-heading">
          <div>
            <h2>Location selector</h2>
            <p>Explore your organization&apos;s geographic structure.</p>
          </div>
          <span className="status-badge">Ogun ready</span>
        </div>
        <div className="geo-grid">
          <label className="geo-select">
            <span>State</span>
            <span className="geo-select-wrap" style={{ pointerEvents: "none", opacity: 0.8 }}>
              <select disabled value={state}>
                <option value={state}>{ogunState?.name || "Ogun State"}</option>
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
          <Select
            label="Local Government"
            value={lga}
            options={lgas}
            onChange={selectLga}
            disabled={!state}
          />
          <Select
            label="Ward"
            value={ward}
            options={wards}
            onChange={selectWard}
            disabled={!lga}
          />
          <Select
            label="Polling Unit"
            value={unit}
            options={units}
            onChange={setUnit}
            disabled={!ward}
          />
        </div>
        {ward && (
          <div className="geo-result">
            <MapPinned size={18} />
            <span>
              <strong>
                {selectedUnit
                  ? selectedUnit.name
                  : `${units.length} polling units`}
              </strong>
              <small>
                {selectedUnit
                  ? `Polling unit code: ${selectedUnit.code}`
                  : "Available in the selected ward"}
              </small>
            </span>
          </div>
        )}
        {state && <div className="geography-members"><div className="panel-heading"><div><h2>Members in this geography</h2><p>{unit ? selectedUnit?.name : ward ? "Selected ward" : lga ? "Selected local government" : ogunState?.name}</p></div><span className="status-badge">{members.length} shown</span></div>{membersLoading ? <div className="loading-state">Loading members...</div> : membersError ? <div className="error-state">{membersError}</div> : members.length === 0 ? <div className="empty-state"><UserRound size={22} /><h2>No members found</h2><p>No members are assigned to the selected geography.</p></div> : <div className="geography-member-list">{members.map((member) => <article className="geography-member-card" key={member.id}><div className="conversation-avatar">{`${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase()}</div><div><strong>{member.firstName} {member.lastName}</strong><small>{member.email ?? member.phone ?? "No contact details"}</small><small>{member.ward?.name ?? member.localGovernment?.name ?? member.state?.name ?? "Unassigned"}</small></div><span className={`member-status ${member.status.toLowerCase()}`}>{member.status}</span><a className="secondary-button" href={`/members/${member.id}`}>View member</a></article>)}</div>}</div>}
      </section>
    </WorkspaceShell>
  );
}
