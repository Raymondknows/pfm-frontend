import { MessageCircle } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ChatWorkspace } from "@/components/chat-workspace";

export default function CommunicationsPage() {
  return <WorkspaceShell title="Communications" subtitle="Reach members through permissioned, consent-aware channels."><section className="panel page-panel chat-panel"><div className="panel-heading"><div><h2>Communication center</h2><p>Official announcements and outbound campaigns remain separate from private messages.</p></div><MessageCircle size={20} color="#247f65" /></div><ChatWorkspace /></section></WorkspaceShell>;
}
