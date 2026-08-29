"use client";

import { useEffect, useState } from "react";

type StoredUser = { firstName?: string; lastName?: string; email?: string; roles?: Array<{ name?: string }> };

export function UserIdentity({ links = false }: { links?: boolean }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  useEffect(() => { const stored = localStorage.getItem("pfm.user"); if (stored) { try { setUser(JSON.parse(stored) as StoredUser); } catch { setUser(null); } } }, []);
  const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Account" : "Account";
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "AC";
  const role = user?.roles?.[0]?.name ?? "Member";
  const avatar = <span className="avatar">{initials}</span>;
  const profile = <span className="profile"><strong>{name}</strong><span>{role}</span></span>;
  return <>{links ? <a href="/settings" aria-label="Open settings">{avatar}</a> : avatar}{links ? <a href="/settings">{profile}</a> : profile}</>;
}
