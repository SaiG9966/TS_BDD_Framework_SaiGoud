import type { Page } from "@playwright/test";

export async function highlightElement(page: Page, locator: string, enabled = false) {
  if (!enabled) return;

  const element = page.locator(locator);

  await element.evaluate((el: HTMLElement) => {
    el.style.border = "3px solid red";
    el.style.backgroundColor = "yellow";
  });
}
