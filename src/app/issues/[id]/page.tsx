import { WorkspaceShell } from "@/components/workspace-shell";
import { IssueDetail } from "@/components/issue-detail";

export default function IssueDetailPage() {
  return (
    <WorkspaceShell
      title="Issue details"
      subtitle="View and manage this issue."
    >
      <IssueDetail />
    </WorkspaceShell>
  );
}
