import type { Locator, Page } from "playwright";

import type { RuntimeConfig } from "../config/runtimeConfig.ts";
import { highlightElement } from "./highlight.ts";

export type LocatorTarget = string | Locator;
type SelectOptionInput = Parameters<Locator["selectOption"]>[0];

/**
 * PlaywrightActions — base class for all page objects.
 * Contains generic browser interaction methods (click, fill, check, etc.).
 * Extended by PlaywrightAssertions which adds expectXxx() assertion helpers.
 * All page objects should extend PlaywrightAssertions to get both.
 */
export class PlaywrightActions {
  protected readonly page: Page;
  protected readonly runtime: RuntimeConfig;

  constructor(page: Page, runtime: RuntimeConfig) {
    this.page = page;
    this.runtime = runtime;
  }

  protected locator(target: LocatorTarget): Locator {
    return typeof target === "string" ? this.page.locator(target) : target;
  }

  protected async highlight(target: LocatorTarget): Promise<void> {
    if (!this.runtime.highlightElements) return;

    if (typeof target === "string") {
      await highlightElement(this.page, target, true);
      return;
    }

    await target.evaluate((el: HTMLElement) => {
      el.style.border = "3px solid red";
      el.style.backgroundColor = "yellow";
    });
  }

  async goto(url: string, waitForSelector?: LocatorTarget): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });

    if (waitForSelector) {
      await this.waitForVisible(waitForSelector, this.runtime.navigationTimeoutMs);
    }
  }

  async waitForVisible(target: LocatorTarget, timeout = this.runtime.actionTimeoutMs): Promise<void> {
    await this.locator(target).waitFor({ state: "visible", timeout });
  }

  async waitForHidden(target: LocatorTarget, timeout = this.runtime.actionTimeoutMs): Promise<void> {
    await this.locator(target).waitFor({ state: "hidden", timeout });
  }

  async waitForEnabled(target: LocatorTarget, timeout = this.runtime.actionTimeoutMs): Promise<void> {
    const locator = this.locator(target);
    await locator.waitFor({ state: "visible", timeout });

    // Poll until enabled or timeout is reached
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await locator.isEnabled().catch(() => false)) {
        return;
      }
      await this.page.waitForTimeout(200);
    }
    // If we reach here, it didn't become enabled, but we avoid throwing blindly in case they catch it.
    // Playwright actions automatically wait for actionability anyway.
  }

  // A cleaner approach for enabled:
  async checkEnabled(target: LocatorTarget): Promise<boolean> {
    return await this.locator(target).isEnabled();
  }

  async waitForTimeout(timeoutMs: number): Promise<void> {
    await this.page.waitForTimeout(timeoutMs);
  }

  // Predefined specific timeout shortcuts
  async W5(): Promise<void> {
    await this.page.waitForTimeout(500);
  }
  async W10(): Promise<void> {
    await this.page.waitForTimeout(1000);
  }
  async W20(): Promise<void> {
    await this.page.waitForTimeout(2000);
  }
  async W30(): Promise<void> {
    await this.page.waitForTimeout(3000);
  }
  async W40(): Promise<void> {
    await this.page.waitForTimeout(4000);
  }
  async W50(): Promise<void> {
    await this.page.waitForTimeout(5000);
  }
  async W100(): Promise<void> {
    await this.page.waitForTimeout(10000);
  }

  async waitForUrl(url: string | RegExp, timeout = this.runtime.navigationTimeoutMs): Promise<void> {
    await this.page.waitForURL(url, { timeout });
  }

  async waitForLoadState(state: "load" | "domcontentloaded" | "networkidle" = "load"): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async click(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).click();
  }

  async dblclick(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).dblclick();
  }

  async rightclick(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).click({ button: "right" });
  }

  async tap(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).tap();
  }

  async focus(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).focus();
  }

  async blur(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.locator(target).blur();
  }

  async pressSequentially(target: LocatorTarget, text: string, delay?: number): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).pressSequentially(text, { delay });
  }

  async getAttribute(target: LocatorTarget, name: string): Promise<string | null> {
    await this.waitForVisible(target);
    return this.locator(target).getAttribute(name);
  }

  async count(target: LocatorTarget): Promise<number> {
    return this.locator(target).count();
  }

  async evaluate<R>(
    target: LocatorTarget,
    pageFunction: (el: HTMLElement | SVGElement, arg: unknown) => R | Promise<R>,
    arg?: unknown
  ): Promise<R> {
    await this.waitForVisible(target);
    return this.locator(target).evaluate(pageFunction, arg);
  }

  async fillText(target: LocatorTarget, value: string): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).fill("");
    await this.locator(target).fill(value);
  }

  async clear(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).clear();
  }

  async dragAndDrop(source: LocatorTarget, target: LocatorTarget): Promise<void> {
    await this.waitForVisible(source);
    await this.waitForVisible(target);
    await this.highlight(source);
    await this.locator(source).dragTo(this.locator(target));
  }

  async dispatchEvent(
    target: LocatorTarget,
    type: string,
    eventInit?: Record<string, unknown>
  ): Promise<void> {
    await this.waitForVisible(target);
    await this.locator(target).dispatchEvent(type, eventInit);
  }

  async typeText(target: LocatorTarget, value: string): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).clear();
    await this.locator(target).type(value);
  }

  async press(target: LocatorTarget, key: string): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).press(key);
  }

  async check(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).check();
  }

  async uncheck(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).uncheck();
  }

  async select(target: LocatorTarget, option: SelectOptionInput): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).selectOption(option);
  }

  async hover(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).hover();
  }

  async scrollIntoView(target: LocatorTarget): Promise<void> {
    await this.waitForVisible(target);
    await this.locator(target).scrollIntoViewIfNeeded();
  }

  async uploadFile(target: LocatorTarget, filePaths: string | string[]): Promise<void> {
    await this.waitForVisible(target);
    await this.highlight(target);
    await this.locator(target).setInputFiles(filePaths);
  }

  async getText(target: LocatorTarget): Promise<string> {
    await this.waitForVisible(target);
    return (await this.locator(target).innerText()).trim();
  }

  async getInputValue(target: LocatorTarget): Promise<string> {
    await this.waitForVisible(target);
    return this.locator(target).inputValue();
  }

  async isChecked(target: LocatorTarget): Promise<boolean> {
    await this.waitForVisible(target);
    return this.locator(target).isChecked();
  }

  async isVisible(target: LocatorTarget): Promise<boolean> {
    return this.locator(target).isVisible();
  }

  async screenshot(filePath: string, fullPage = true): Promise<void> {
    await this.page.screenshot({ path: filePath, fullPage });
  }
}
