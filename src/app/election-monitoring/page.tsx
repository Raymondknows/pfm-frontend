import { Camera, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ElectionMonitoringWorkspace } from "@/components/election-monitoring-workspace";

const steps = [
  { icon: ClipboardCheck, title: "Record observations", text: "Capture structured polling-unit updates with time, category, notes, and review status." },
  { icon: Camera, title: "Attach evidence", text: "Add camera photos and supporting files through a private, scope-checked upload flow." },
  { icon: ShieldCheck, title: "Review securely", text: "Keep submissions inside the authorized geographic hierarchy with a complete audit trail." },
  { icon: FileText, title: "Track coverage", text: "Monitor submitted, reviewed, escalated, and unresolved polling-unit records." },
];

export default function ElectionMonitoringPage() {
  return <WorkspaceShell title="Election Monitor" subtitle="Polling-unit observations, evidence, and review workflows." hidePageHeader><section className="panel election-monitor-page"><div className="election-monitor-hero"><div><span className="eyebrow">Field operations</span><h1>Election monitoring, organized by place.</h1><p>Submit a structured polling-unit observation for Super Admin review.</p><span className="election-monitor-notice">Phase 1 active: structured observations</span></div><div className="election-monitor-mark"><ClipboardCheck size={38} /></div></div><ElectionMonitoringWorkspace /><div className="election-monitor-grid">{steps.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={20} /><h2>{title}</h2><p>{text}</p></article>)}</div></section></WorkspaceShell>;
}
