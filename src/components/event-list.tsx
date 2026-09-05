"use client";

import { CalendarDays, Clock3, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";
import { useSessionHandler } from "@/lib/session";

const apiUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();
type EventItem = { id: string; title: string; description: string; startsAt: string; endsAt: string | null };

export function EventList() {
  const { handleUnauthorizedResponse } = useSessionHandler();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${apiUrl}/v1/events`, { headers: { Authorization: `Bearer ${localStorage.getItem("pfm.accessToken") ?? ""}` } })
      .then(async (response) => {
        if (handleUnauthorizedResponse(response.status)) return [];
        if (!response.ok) throw new Error("Events could not be loaded");
        return response.json() as Promise<EventItem[]>;
      })
      .then(setEvents)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Events could not be loaded"))
      .finally(() => setLoading(false));
  }, [handleUnauthorizedResponse]);
  if (loading) return <div className="loading-state">Loading events...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!events.length) return <div className="empty-state"><div className="empty-mark"><CalendarDays size={20} /></div><h2>No events yet</h2><p>Create the first event for your movement and invite the right people.</p><a className="primary-button" href="/events/new">Create an event</a></div>;
  return <div className="event-list">{events.map((item) => <article className="event-card" key={item.id}><div className="event-card-date"><strong>{new Date(item.startsAt).toLocaleDateString([], { day: "2-digit" })}</strong><span>{new Date(item.startsAt).toLocaleDateString([], { month: "short" })}</span></div><div><h3>{item.title}</h3><p>{item.description}</p><div className="event-meta"><span><Clock3 size={13} />{new Date(item.startsAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span><span><MapPinned size={13} />Organization event</span></div></div></article>)}</div>;
}
