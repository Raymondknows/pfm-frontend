"use client";

import {
  Activity,
  BarChart3,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  MapPinned,
  MessageCircle,
  Bell,
  ClipboardCheck,
  Settings2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LogoutButton } from "./logout-button";

type StoredUser = {
  roles?: Array<{ name?: string; permissions?: string[] }>;
};

type NavigationLink = {
  label: string;
  href: string;
  permission: string;
  alternatePermissions?: string[];
  icon: typeof LayoutDashboard;
  standout?: boolean;
};

const workspaceLinks: NavigationLink[] = [
  { label: "Overview", href: "/dashboard", permission: "dashboard:read", icon: LayoutDashboard },
  { label: "Members", href: "/members", permission: "members:read", icon: Users },
  { label: "Geography", href: "/geography", permission: "geography:read", icon: MapPinned },
  { label: "Communities", href: "/communities", permission: "communities:read", icon: Activity },
  { label: "Events", href: "/events", permission: "events:read", icon: CalendarDays },
  { label: "Messages", href: "/messages", permission: "messages:read", icon: MessageCircle },
  { label: "Reports", href: "/reports", permission: "reports:read", icon: BarChart3 },
  { label: "Submit report", href: "/reports/new", permission: "reports:write", icon: BarChart3 },
  { label: "Election Monitor", href: "/election-monitoring", permission: "election_monitoring:submit", alternatePermissions: ["election_monitoring:read", "reports:read"], icon: ClipboardCheck, standout: true },
  { label: "Notifications", href: "/notifications", permission: "notifications:read", icon: Bell },
];

function usePermissions() {
  const [storedUser, setStoredUser] = useState("");
  useEffect(() => {
    const readUser = () => setStoredUser(localStorage.getItem("pfm.user") ?? "");
    readUser();
    window.addEventListener("storage", readUser);
    return () => window.removeEventListener("storage", readUser);
  }, []);
  try {
    const user = JSON.parse(storedUser) as StoredUser;
    return new Set(user.roles?.flatMap((role) => role.permissions ?? []) ?? []);
  } catch {
    return new Set<string>();
  }
}

export function useHasPermission(permission: string) {
  return usePermissions().has(permission);
}

export function WorkspaceNavigation({
  activeLabel,
  memberCount,
}: {
  activeLabel?: string;
  memberCount?: number | string;
}) {
  const permissions = usePermissions();
  const visibleLinks = workspaceLinks.filter(({ permission, alternatePermissions }) =>
    permissions.has(permission) || alternatePermissions?.some((alternatePermission) => permissions.has(alternatePermission)),
  );

  return (
    <>
      <nav className="nav-list" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        {visibleLinks.map(({ label, href, icon: Icon, standout }) => (
          <a
            className={`nav-item ${label === activeLabel ? "active" : ""} ${standout ? "nav-item-standout" : ""}`}
            href={href}
            key={label}
          >
            <Icon size={18} />
            {label}
            {label === "Members" && memberCount !== undefined && (
              <span className="nav-count">{memberCount}</span>
            )}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <a className="nav-item" href="/settings">
          <Settings2 size={18} />
          Settings
        </a>
        <a className="nav-item" href="/help">
          <CircleHelp size={18} />
          Help center
        </a>
        <LogoutButton />
      </div>
    </>
  );
}