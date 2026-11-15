"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WorkspaceNavigation } from "./workspace-navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; roles?: Array<{ name: string }> } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>(".drawer-close")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="mobile-menu"
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-workspace-navigation"
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
            ref={drawerRef}
            id="mobile-workspace-navigation"
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            tabIndex={-1}
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
