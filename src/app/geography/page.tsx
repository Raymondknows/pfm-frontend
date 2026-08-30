"use client";

import { useEffect, useState } from "react";
import { ChevronDown, MapPinned } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

type Option = { id: string; name: string; code: string };
const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";
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
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [unit, setUnit] = useState("");
  useEffect(() => {
    fetchOptions(`${api}/states`)
      .then(setStates)
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
  const selectedUnit = units.find((option) => option.id === unit);
  function selectState(value: string) {
    setState(value);
    setLgas([]); setWards([]); setUnits([]);
    setLga(""); setWard(""); setUnit("");
  }
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
          <Select
            label="State"
            value={state}
            options={states}
            onChange={selectState}
          />
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
      </section>
    </WorkspaceShell>
  );
}
