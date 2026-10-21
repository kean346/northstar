import { test, expect } from "@playwright/test";
import { csv } from "../src/lib/data";
import fs from "node:fs/promises";
test("period, analytics, customer, export, settings, search and reset workflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A clearer view of growth." }),
  ).toBeVisible();
  await page.getByLabel("Reporting period").selectOption("2025-02");
  await page.getByRole("button", { name: "View revenue report" }).click();
  await expect(
    page.getByRole("heading", { name: "Period report" }),
  ).toBeVisible();
  await expect(page.getByLabel("Reporting period")).toHaveValue("2025-02");
  await page.getByLabel("Channel filter").selectOption("Direct");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("northstar-2025-02-direct.csv");
  expect(await fs.readFile((await file.path())!, "utf8")).toBe(
    csv("2025-02", "Direct"),
  );
  await page.getByRole("button", { name: "Customers", exact: true }).click();
  await page.getByLabel("Search customers").fill("Daniel");
  await page
    .getByRole("button", { name: /Daniel Jacobs/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Growth ·")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Search customers").fill("does not exist");
  await expect(page.getByText("No customers found")).toBeVisible();
  await page.getByRole("button", { name: "Clear customer filters" }).click();
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Revenue by transaction date" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Integrations", exact: true }).click();
  await page.getByRole("button", { name: "Enable simulation" }).first().click();
  await expect(
    page.getByRole("button", { name: "Disable simulation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Workspace name").fill("Test workspace");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset demo", exact: true })
    .click();
  await expect(page.getByLabel("Reporting period")).toHaveValue("2025-03");
  await expect(
    page.getByRole("button", { name: /Acme Workspace/ }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("textbox", { name: "Search workspace" }).fill("Reports");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Period report" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
for (const width of [1440, 768, 375])
  test(`layout and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "A clearer view of growth." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("svg.recharts-surface")).toHaveCount(2);
    await page.screenshot({
      path: `/tmp/northstar-${width}.png`,
      fullPage: true,
    });
    if (width === 375) {
      await page.getByLabel("Toggle navigation").click();
      await expect(
        page.getByRole("button", { name: "Customers", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByLabel("Toggle navigation")).toBeFocused();
    }
    await page.getByRole("button", { name: "Search anything" }).click();
    await expect(page.getByRole("textbox", { name: "Search workspace" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
