import { WorkspaceShell } from "@/components/workspace-shell";
import ReportForm from "@/components/report-form";

export default function NewReportPage() {
  return (
    <WorkspaceShell
      title="Submit New Report"
      subtitle="Fill out the form below to submit a new field report."
    >
      <ReportForm />
    </WorkspaceShell>
  );
}
