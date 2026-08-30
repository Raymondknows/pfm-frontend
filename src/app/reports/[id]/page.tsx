import { WorkspaceShell } from "@/components/workspace-shell";
import ReportDetail from "@/components/report-detail";

export default function ReportDetailPage() {
  return (
    <WorkspaceShell
      title="Report Details"
      subtitle="View and manage the field report details."
    >
      <ReportDetail />
    </WorkspaceShell>
  );
}
