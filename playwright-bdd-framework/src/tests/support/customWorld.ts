import type { IWorldOptions } from "@cucumber/cucumber";
import { World, setWorldConstructor } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import { runtimeConfig, type RuntimeConfig } from "../../config/runtimeConfig.ts";

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page!: Page;
  videoPath?: string;
  runtime: RuntimeConfig;
  formData: Record<string, unknown>;

  constructor(options: IWorldOptions) {
    super(options);
    this.runtime = runtimeConfig;
    this.formData = {};
  }
}

setWorldConstructor(CustomWorld);
