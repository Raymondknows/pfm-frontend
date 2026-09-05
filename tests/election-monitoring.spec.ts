import { expect, test, type Page } from "@playwright/test";

const event = { id: "event-1", name: "Ogun Election Monitoring", startsAt: "2026-09-05T00:00:00.000Z", endsAt: null, isActive: true };
const states = [{ id: "state-og", name: "Ogun", code: "OG" }];
const lgas = [{ id: "lga-1", name: "Abeokuta South", code: "ABK" }];
const wards = [{ id: "ward-1", name: "Ward 1", code: "01" }];
const units = [{ id: "unit-1", name: "Polling Unit 1", code: "001" }];

async function mockMonitoringApi(page: Page, superAdmin = false) {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.endsWith("/v1/election-monitoring/events")) return route.fulfill({ json: [event] });
    if (url.endsWith("/v1/geography/states")) return route.fulfill({ json: states });
    if (url.includes("/v1/geography/states/state-og/lgas")) return route.fulfill({ json: lgas });
    if (url.includes("/v1/geography/lgas/lga-1/wards")) return route.fulfill({ json: wards });
    if (url.includes("/v1/geography/wards/ward-1/polling-units")) return route.fulfill({ json: units });
    if (url.endsWith("/v1/election-monitoring/observations")) return route.fulfill({ json: superAdmin ? [] : { message: "not used" } });
    if (url.endsWith("/v1/election-monitoring/analytics")) return route.fulfill({ json: { total: 0, coveredPollingUnits: 0, byStatus: [], byCategory: [] } });
    return route.continue();
  });
}

async function setUser(page: Page, roles: Array<{ name: string; permissions: string[] }>) {
  await page.addInitScript(({ user }) => { localStorage.setItem("pfm.accessToken", "test-token"); localStorage.setItem("pfm.user", JSON.stringify(user)); }, { user: { email: "tester@pfm.local", roles } });
}

test("member sees the active event and Ogun geography", async ({ page }) => {
  await setUser(page, [{ name: "Member", permissions: ["election_monitoring:submit", "geography:read"] }]);
  await mockMonitoringApi(page);
  await page.goto("/election-monitoring");

  await expect(page.getByLabel("Monitoring event")).toHaveValue("");
  await expect(page.getByRole("option", { name: "Ogun Election Monitoring" })).toBeAttached();
  await page.getByLabel("Monitoring event").selectOption("event-1");
  await expect(page.getByLabel("State")).toHaveValue("state-og");
  await expect(page.getByLabel("State")).toBeDisabled();
  await expect(page.getByLabel("LGA")).toContainText("Abeokuta South", { timeout: 10000 });
  await page.getByLabel("LGA").selectOption("lga-1");
  await expect(page.getByLabel("Ward")).toContainText("Ward 1", { timeout: 10000 });
});

test("Super Admin sees the review queue", async ({ page }) => {
  await setUser(page, [{ name: "Super Admin", permissions: ["election_monitoring:submit", "election_monitoring:read", "election_monitoring:review", "election_monitoring:export"] }]);
  await mockMonitoringApi(page, true);
  await page.goto("/election-monitoring");

  await expect(page.getByRole("heading", { name: "Observation queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
});

test("Super Admin receives reports but cannot submit them", async ({ page }) => {
  await setUser(page, [{ name: "Super Admin", permissions: ["reports:read"] }]);
  await mockMonitoringApi(page);
  await page.goto("/election-monitoring");

  await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Submit report" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Submit Report/ })).toHaveCount(0);
});

test("Field roles can access report submission", async ({ page }) => {
  await setUser(page, [{ name: "Polling Unit Coordinator", permissions: ["reports:write"] }]);
  await page.goto("/reports/new");

  await expect(page.getByRole("link", { name: "Submit report" })).toBeVisible();
  await expect(page.getByText("Report submission is restricted")).toHaveCount(0);
});