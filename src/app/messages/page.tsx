import { ChatWorkspace } from "@/components/chat-workspace";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function MessagesPage() {
  return <WorkspaceShell title="Messages" subtitle="Private, organization-scoped conversations for your permitted communities and contacts." hidePageHeader fullHeight><section className="panel page-panel chat-panel messages-panel"><ChatWorkspace /></section></WorkspaceShell>;
}