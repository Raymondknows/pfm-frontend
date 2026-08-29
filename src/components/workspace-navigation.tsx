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
  Settings2,
  Users,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { LogoutButton } from "./logout-button";

type StoredUser = {
  roles?: Array<{ permissions?: string[] }>;
};

type NavigationLink = {
  label: string;
  href: string;
  permission: string;
  icon: typeof LayoutDashboard;
};

const workspaceLinks: NavigationLink[] = [
  { label: "Overview", href: "/", permission: "dashboard:read", icon: LayoutDashboard },
  { label: "Members", href: "/members", permission: "members:read", icon: Users },
  { label: "Geography", href: "/geography", permission: "geography:read", icon: MapPinned },
  { label: "Communities", href: "/communities", permission: "communities:read", icon: Activity },
  { label: "Events", href: "/events", permission: "events:read", icon: CalendarDays },
  { label: "Messages", href: "/messages", permission: "messages:read", icon: MessageCircle },
  { label: "Reports", href: "/reports", permission: "reports:read", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", permission: "notifications:read", icon: Bell },
];

function usePermissions() {
  const storedUser = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => localStorage.getItem("pfm.user") ?? "",
    () => "",
  );
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
  const visibleLinks = workspaceLinks.filter(({ permission }) =>
    permissions.has(permission),
  );

  return (
    <>
      <nav className="nav-list" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        {visibleLinks.map(({ label, href, icon: Icon }) => (
          <a
            className={`nav-item ${label === activeLabel ? "active" : ""}`}
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