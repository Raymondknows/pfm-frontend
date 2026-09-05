import { CalendarPlus } from "lucide-react";
import { EmptyState, WorkspaceShell } from "@/components/workspace-shell";
import { EventList } from "@/components/event-list";

export default function EventsPage() {
  return <WorkspaceShell title="Events" subtitle="Coordinate gatherings across your authorized geography." action={<a className="primary-button" href="/events/new"><CalendarPlus size={17} />Create event</a>}><section className="panel page-panel"><div className="panel-heading"><div><h2>Upcoming events</h2><p>Events are visible according to the current organization access.</p></div></div><EventList /></section></WorkspaceShell>;
}
