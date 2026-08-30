"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, WorkspaceShell } from "@/components/workspace-shell";

type Notification = {
  id: string;
  channel: string;
  status: string;
  subject: string | null;
  body: string;
  createdAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("pfm.accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${apiUrl}/v1/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Unable to load notifications");
        return body as Notification[];
      })
      .then(setItems)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load notifications"));
  }, []);

  return (
    <WorkspaceShell title="Notifications" subtitle="Private updates delivered within your authorized organization and geographic scope.">
      <section className="panel page-panel">
        <div className="panel-heading"><div><h2>Recent notifications</h2><p>Only notifications addressed to your permitted membership records are shown.</p></div><Bell size={20} color="#247f65" /></div>
        {error ? <p className="login-error" role="alert">{error}</p> : items?.length ? <div className="activity-list">{items.map((item) => <article className="activity-item" key={item.id}><span className="activity-avatar"><CheckCircle2 size={16} /></span><div><strong>{item.subject ?? "PFM update"}</strong><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()} · {item.channel.replaceAll("_", " ").toLowerCase()}</small></div></article>)}</div> : items ? <EmptyState title="No notifications yet" description="Updates about your membership and permitted activity will appear here." /> : <p>Loading notifications...</p>}
      </section>
    </WorkspaceShell>
  );
}