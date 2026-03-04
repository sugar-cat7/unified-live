import * as path from "node:path";
import { expect, test } from "@playwright/test";
import { getStoryUrl, loadStories } from "./utils/storyLoader";

const staticDir = path.join(__dirname, "../storybook-static");
const stories = loadStories(staticDir);

for (const story of stories) {
  test(`VRT: ${story.title} - ${story.name}`, async ({ page }) => {
    const url = getStoryUrl(story.id);
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    await page
      .locator("#storybook-root > *")
      .first()
      .waitFor({ state: "visible", timeout: 10000 });

    await expect(page).toHaveScreenshot(`${story.id}.png`);
  });
}
