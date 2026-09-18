import { KeyRound, Settings2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function SettingsPage() {
  return <WorkspaceShell title="Settings" subtitle="Configure your organization workspace and access model."><section className="settings-grid"><article className="panel settings-card"><div className="settings-card-icon"><Settings2 size={19} /></div><span className="eyebrow">Organization</span><h2>People&apos;s First Movement</h2><p>National workspace</p></article><article className="panel settings-card"><div className="settings-card-icon blue"><KeyRound size={19} /></div><span className="eyebrow">Access</span><h2>Scoped permissions</h2><p>Role, permission, and geographic access model</p></article></section></WorkspaceShell>;
}
