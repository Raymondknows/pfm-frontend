"use client";

import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    const rawUser = localStorage.getItem("pfm.user");
    const roles = rawUser ? JSON.parse(rawUser)?.roles ?? [] : [];
    const primaryRole = roles[0]?.name?.toLowerCase();
    const destination =
      primaryRole === "member"
        ? "/dashboard/member"
        : primaryRole === "candidate"
          ? "/dashboard/candidate"
          : primaryRole === "admin" || primaryRole === "super admin" || primaryRole === "super-admin"
            ? "/dashboard/admin"
            : primaryRole?.includes("state")
              ? "/dashboard/state"
              : primaryRole?.includes("lga")
                ? "/dashboard/lga"
                : primaryRole?.includes("ward")
                  ? "/dashboard/ward"
                  : primaryRole?.includes("polling")
                    ? "/dashboard/polling-unit"
                    : primaryRole?.includes("community")
                      ? "/dashboard/community"
                      : "/login";
    window.location.href = destination;
  }, []);

  return null;
}
