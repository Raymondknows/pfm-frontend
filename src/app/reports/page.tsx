import { WorkspaceShell } from "@/components/workspace-shell";
import ReportList from "@/components/report-list";

export default function ReportsPage() {
  return (
    <WorkspaceShell
      title="Field Reports"
      subtitle="Submit and track field reports from your area."
    >
      <ReportList />
    </WorkspaceShell>
  );
}

