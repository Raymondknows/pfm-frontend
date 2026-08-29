import { CalendarPlus } from "lucide-react";
import { EmptyState, WorkspaceShell } from "@/components/workspace-shell";

export default function EventsPage() {
  return <WorkspaceShell title="Events" subtitle="Coordinate gatherings across your authorized geography." action={<a className="primary-button" href="/events/new"><CalendarPlus size={17} />Create event</a>}><section className="panel page-panel"><div className="panel-heading"><div><h2>Upcoming events</h2><p>Events will be visible according to each user&apos;s scope.</p></div></div><EmptyState title="No events yet" description="Create the first event for your movement and invite the right communities." href="/events/new" label="Create an event" /></section></WorkspaceShell>;
}
