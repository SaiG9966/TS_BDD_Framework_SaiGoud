import { After, AfterAll, Before, BeforeAll, setDefaultTimeout, Status } from "@cucumber/cucumber";
import { chromium, firefox, webkit } from "playwright";
import type { Browser } from "playwright";
import fs from "fs";
import path from "path";
import { runtimeConfig } from "../../config/runtimeConfig.ts";
import type { CustomWorld } from "../support/customWorld.ts";

setDefaultTimeout(runtimeConfig.timeoutMs);

let sharedBrowser: Browser;

const browserFactory = {
  chromium,
  firefox,
  webkit,
};

const isMissingBrowserBinaryError = (message: string) =>
  /executable doesn't exist|please run the following command|npx playwright install/i.test(message);

const isHeadedEnvironmentError = (message: string) =>
  /xserver|display|headed browser|failed to launch browser process/i.test(message);

const isPageClosedError = (message: string) =>
  /target page, context or browser has been closed|page has been closed/i.test(message);

BeforeAll(async function () {
  const launcher = browserFactory[runtimeConfig.browser] ?? chromium;

  const launchOptions: Parameters<typeof chromium.launch>[0] = {
    headless: runtimeConfig.headless,
    slowMo: runtimeConfig.slowMo,
  };

  if (runtimeConfig.maximizeBrowser) {
    launchOptions.args = ["--start-maximized"];
  }

  try {
    sharedBrowser = await launcher.launch(launchOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (isMissingBrowserBinaryError(message)) {
      throw new Error(
        `[Browser Setup Error] Playwright browser binary is missing for '${runtimeConfig.browser}'. Run: npx playwright install ${runtimeConfig.browser}`
      );
    }

    if (!runtimeConfig.headless && isHeadedEnvironmentError(message)) {
      console.warn(
        `[Browser Launch Warning] Headed mode failed for '${runtimeConfig.browser}'. Retrying in headless mode for stability.`
      );
      sharedBrowser = await launcher.launch({ ...launchOptions, headless: true });
      return;
    }

    throw error;
  }
});

Before(async function (this: CustomWorld) {
  const testResultsDir = path.resolve(process.cwd(), "test-results");
  const videoDir = path.join(testResultsDir, "videos");
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const contextOptions: Parameters<Browser["newContext"]>[0] = {
    ignoreHTTPSErrors: true,
    viewport: runtimeConfig.maximizeBrowser ? null : { width: 1366, height: 768 },
    recordVideo: runtimeConfig.recordVideo ? { dir: videoDir } : undefined,
  };

  if (runtimeConfig.baseUrl) {
    contextOptions.baseURL = runtimeConfig.baseUrl;
  }

  this.context = await sharedBrowser.newContext(contextOptions);
  this.context.setDefaultTimeout(runtimeConfig.actionTimeoutMs);
  this.context.setDefaultNavigationTimeout(runtimeConfig.navigationTimeoutMs);

  if (runtimeConfig.trace) {
    await this.context.tracing.start({ screenshots: true, snapshots: true });
  }

  this.page = await this.context.newPage();
  this.formData = {};
});

After(async function (this: CustomWorld, { result, pickle }) {
  // Always attach screenshot on failure or when enabled
  if (
    (runtimeConfig.screenshotOnFailure && result?.status === Status.FAILED) ||
    runtimeConfig.attachScreenshots
  ) {
    if (this.page) {
      try {
        const screenshot = await this.page.screenshot({ fullPage: true });
        await this.attach(screenshot, "image/png");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isPageClosedError(message)) {
          console.warn(`Failed to capture screenshot: ${message}`);
        }
      }
    }
  }

  if (runtimeConfig.trace && this.context && pickle) {
    await this.context.tracing.stop({
      path: `test-results/${pickle.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.zip`,
    });
  }

  const recordedVideo = runtimeConfig.recordVideo && this.page ? this.page.video() : null;

  await this.context?.close();

  // Attach video after context is closed (Playwright finalizes video on close)
  if (recordedVideo) {
    try {
      const videoPath = await recordedVideo.path();
      if (videoPath && fs.existsSync(videoPath)) {
        const videoBuffer = fs.readFileSync(videoPath);
        await this.attach(videoBuffer, "video/webm");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isPageClosedError(message)) {
        console.warn(`Failed to attach video: ${message}`);
      }
    }
  }
});

AfterAll(async function () {
  await sharedBrowser?.close();
});
