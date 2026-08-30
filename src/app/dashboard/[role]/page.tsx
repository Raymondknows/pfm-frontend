import { RoleHubDashboard } from "@/components/role-hub-dashboard";

const labels: Record<string, string> = {
  candidate: "Candidate dashboard",
  admin: "Admin dashboard",
  "super-admin": "Admin dashboard",
  state: "State dashboard",
  lga: "LGA dashboard",
  ward: "Ward dashboard",
  "polling-unit": "Polling unit dashboard",
  community: "Community dashboard",
  member: "Member dashboard",
};

export default async function RoleDashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  return <RoleHubDashboard requestedRole={labels[role] ?? "Dashboard"} />;
}
