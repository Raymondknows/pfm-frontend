"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { WorkspaceNavigation } from "./workspace-navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);
   return <><button className="mobile-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={21} /></button>{open && <div className="mobile-drawer-backdrop" role="presentation" onClick={() => setOpen(false)}><aside className="mobile-drawer" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}><div className="mobile-drawer-head"><div className="brand"><span className="brand-mark">P</span><span>People&apos;s First</span></div><button className="drawer-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={21} /></button></div><div className="mobile-workspace"><span className="workspace-dot" /><span><small>WORKSPACE</small><strong>PFM National</strong></span></div><WorkspaceNavigation /></aside></div>}</>;
}
