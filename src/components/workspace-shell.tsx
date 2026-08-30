'use client';

import { Activity, Bell, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MobileNav } from "./mobile-nav";
import { UserIdentity } from "./user-identity";
import { WorkspaceNavigation } from "./workspace-navigation";

interface UserInfo {
  email: string;
  roles?: Array<{ name: string }>;
}

export function WorkspaceShell({
  children,
  title,
  subtitle,
  action,
  hidePageHeader = false,
  fullHeight = false,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
  hidePageHeader?: boolean;
  fullHeight?: boolean;
}) {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('pfm.user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (err) {
      console.error('Failed to parse user data:', err);
    }
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">P</span>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-dot" />
          <span>PFM</span>
        </div>
        
        {user && (
          <div className="sidebar-user-profile">
            <div className="user-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-email">{user.email.split('@')[0]}</span>
              {user.roles && user.roles[0] && (
                <span className="user-role">{user.roles[0].name}</span>
              )}
            </div>
          </div>
        )}
        
        <WorkspaceNavigation activeLabel={title} />
      </aside>
      <main className="main-content">
          <header className="topbar">
          <MobileNav />
          <div className="breadcrumb">
            {title} <span>/</span> National workspace
          </div>
          <div className="topbar-actions">
            <a className="icon-button" aria-label="Notifications" href="/notifications">
              <Bell size={19} />
              <i />
            </a>
            <UserIdentity />
            <ChevronDown size={15} />
          </div>
        </header>
        <div className={`content-wrap ${fullHeight ? "content-wrap-full-height" : ""}`}>
          {!hidePageHeader && <section className="welcome-row">
            <div>
              <h1>{title}</h1>
              <p className="lede">{subtitle}</p>
            </div>
            {action}
          </section>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-mark">
        <Activity size={20} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <a className="primary-button" href={href}>
          {label ?? "Get started"}
        </a>
      )}
    </div>
  );
}
