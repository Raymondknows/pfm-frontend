import { WorkspaceShell } from "@/components/workspace-shell";
import { CreateIssueForm } from "@/components/issue-form";

export default function CreateIssuePage() {
  return (
    <WorkspaceShell
      title="Report an issue"
      subtitle="Create a new issue to track operational problems in your scope."
    >
      <section className="panel page-panel">
        <CreateIssueForm />
      </section>
    </WorkspaceShell>
  );
}
