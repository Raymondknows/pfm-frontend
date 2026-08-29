import { FileBarChart } from "lucide-react";
import { EmptyState, WorkspaceShell } from "@/components/workspace-shell";

export default function ReportsPage() {
  return <WorkspaceShell title="Reports" subtitle="Review structured updates from coordinators across Ogun State."><section className="panel page-panel"><div className="panel-heading"><div><h2>Reports workspace</h2><p>Scope-aware reporting keeps local information in the right hands.</p></div><FileBarChart size={20} color="#247f65" /></div><EmptyState title="No reports submitted" description="Field report intake and review will connect to this space in the next phase." href="/geography" label="Review coverage" /></section></WorkspaceShell>;
}
