import { expect, test } from "@playwright/test";

test("home page renders starter content", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/milpa/i);
  await expect(
    page.getByRole("heading", {
      name: "To get started, edit the page.tsx file.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Deploy Now" })).toBeVisible();
});
