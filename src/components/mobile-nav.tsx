"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { WorkspaceNavigation } from "./workspace-navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; roles?: Array<{ name: string }> } | null>(null);

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
    <>
      <button
        className="mobile-menu"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={21} />
      </button>

      {open && (
        <div
          className="mobile-drawer-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <aside
            className="mobile-drawer"
            aria-label="Mobile navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer-head">
              {user && (
                <div className="sidebar-user-profile-mobile">
                  <div className="user-avatar-mobile">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info-mobile">
                    <span className="user-email-mobile">{user.email.split('@')[0]}</span>
                    {user.roles && user.roles[0] && (
                      <span className="user-role-mobile">{user.roles[0].name}</span>
                    )}
                  </div>
                </div>
              )}

              <button
                className="drawer-close"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X size={21} />
              </button>
            </div>

            <WorkspaceNavigation />
          </aside>
        </div>
      )}
    </>
  );
}
