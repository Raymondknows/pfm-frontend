"use client";

import { LogOut } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.peoplesfirstmovement.com";

export function LogoutButton() {
  async function logout() {
    const accessToken = localStorage.getItem("pfm.accessToken");
    const refreshToken = localStorage.getItem("pfm.refreshToken");
    if (accessToken && refreshToken) {
      await fetch(`${apiUrl}/v1/auth/logout`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
    }
    localStorage.removeItem("pfm.accessToken");
    localStorage.removeItem("pfm.refreshToken");
    localStorage.removeItem("pfm.user");
    window.location.href = "/login";
  }

  return <button className="nav-item logout-button" type="button" onClick={logout}><LogOut size={18} />Sign out</button>;
}
