import { Settings2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function SettingsPage() {
  return <WorkspaceShell title="Settings" subtitle="Configure your organization workspace and access model."><section className="settings-grid"><article className="panel settings-card"><Settings2 size={19} color="#247f65" /><h2>Organization</h2><p>People&apos;s First Movement</p><span>National workspace</span></article><article className="panel settings-card"><h2>Access model</h2><p>Role + permission + geographic scope</p><span>Server-side authorization foundation enabled</span></article></section></WorkspaceShell>;
}
