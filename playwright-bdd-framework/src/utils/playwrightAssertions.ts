import { expect } from "@playwright/test";

import type { Page } from "@playwright/test";
import type { RuntimeConfig } from "../config/runtimeConfig.ts";
import { PlaywrightActions, type LocatorTarget } from "./playwrightActions.ts";

/**
 * PlaywrightAssertions extends PlaywrightActions with typed, named assertion methods.
 * All page objects inherit this — call any expectXxx() directly from your steps.
 *
 * Usage in step definition:
 *   await myPage.expectVisible("#header");
 *   await myPage.expectText("#title", "Welcome");
 *   await myPage.expectUrlContains("/dashboard");
 */
export class PlaywrightAssertions extends PlaywrightActions {
  constructor(page: Page, runtime: RuntimeConfig) {
    super(page, runtime);
  }

  /** Assert element is visible on the page */
  async expectVisible(target: LocatorTarget, message?: string): Promise<void> {
    await expect(this.locator(target), message).toBeVisible({
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element is NOT visible (hidden or absent) */
  async expectNotVisible(target: LocatorTarget, message?: string): Promise<void> {
    await expect(this.locator(target), message).toBeHidden({
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element has exact inner text */
  async expectText(target: LocatorTarget, text: string, message?: string): Promise<void> {
    await expect(this.locator(target), message).toHaveText(text, {
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element contains the given substring */
  async expectContainsText(target: LocatorTarget, text: string, message?: string): Promise<void> {
    await expect(this.locator(target), message).toContainText(text, {
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert input/textarea has the given value */
  async expectInputValue(target: LocatorTarget, value: string, message?: string): Promise<void> {
    await expect(this.locator(target), message).toHaveValue(value, {
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert checkbox or radio button is checked */
  async expectChecked(target: LocatorTarget, message?: string): Promise<void> {
    await expect(this.locator(target), message).toBeChecked({
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert checkbox or radio button is NOT checked */
  async expectNotChecked(target: LocatorTarget, message?: string): Promise<void> {
    await expect(this.locator(target), message).not.toBeChecked({
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element is enabled (not disabled) */
  async expectEnabled(target: LocatorTarget, message?: string): Promise<void> {
    await expect(this.locator(target), message).toBeEnabled({
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element is disabled */
  async expectDisabled(target: LocatorTarget, message?: string): Promise<void> {
    await expect(this.locator(target), message).toBeDisabled({
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element attribute equals the given value */
  async expectAttribute(target: LocatorTarget, attr: string, value: string, message?: string): Promise<void> {
    await expect(this.locator(target), message).toHaveAttribute(attr, value, {
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert element attribute contains a substring */
  async expectAttributeContains(target: LocatorTarget, attr: string, substring: string): Promise<void> {
    const actual = await this.locator(target).getAttribute(attr);
    expect(actual, `Expected attribute "${attr}" to contain "${substring}", got "${actual}"`).toContain(
      substring
    );
  }

  /** Assert the number of matching elements */
  async expectCount(target: LocatorTarget, count: number, message?: string): Promise<void> {
    await expect(this.locator(target), message).toHaveCount(count, {
      timeout: this.runtime.actionTimeoutMs,
    });
  }

  /** Assert current page URL contains the given substring */
  async expectUrlContains(substring: string, message?: string): Promise<void> {
    await expect(this.page, message).toHaveURL(new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), {
      timeout: this.runtime.navigationTimeoutMs,
    });
  }

  /** Assert current page URL matches exactly */
  async expectUrl(url: string | RegExp, message?: string): Promise<void> {
    await expect(this.page, message).toHaveURL(url, {
      timeout: this.runtime.navigationTimeoutMs,
    });
  }

  /** Assert page title matches */
  async expectTitle(title: string | RegExp, message?: string): Promise<void> {
    await expect(this.page, message).toHaveTitle(title, {
      timeout: this.runtime.navigationTimeoutMs,
    });
  }
}
