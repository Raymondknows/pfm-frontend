import { WorkspaceShell } from "@/components/workspace-shell";
import { IssueList } from "@/components/issue-list";

export default function IssuesPage() {
  return (
    <WorkspaceShell
      title="Issues"
      subtitle="Report, track, and manage operational issues in your scope."
    >
      <IssueList />
    </WorkspaceShell>
  );
}
