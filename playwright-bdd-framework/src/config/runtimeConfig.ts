import "dotenv/config";
import { z } from "zod";

// ─── Schema ────────────────────────────────────────────────────────────────────

const boolTrue = (v?: string) => !["false", "0", "no", "n", "off"].includes((v ?? "true").toLowerCase());
const boolFlag = (v?: string) => ["true", "1", "yes", "y", "on"].includes((v ?? "").toLowerCase());
const trimmed = (v?: string) => (v ?? "").trim();

const envSchema = z.object({
  BROWSER: z.enum(["chromium", "firefox", "webkit"]).default("chromium"),
  HEADLESS: z.string().optional().transform(boolTrue),
  MAXIMIZE_BROWSER: z.string().optional().transform(boolFlag),
  SLOW_MO: z.coerce.number().nonnegative().default(0),
  DEFAULT_TIMEOUT_MS: z.coerce.number().positive().default(60_000),
  ACTION_TIMEOUT_MS: z.coerce.number().positive().default(10_000),
  NAVIGATION_TIMEOUT_MS: z.coerce.number().positive().default(30_000),
  BASE_URL: z.string().optional().transform(trimmed),
  LOGIN_URL: z.string().optional().transform(trimmed),
  APP_USERNAME: z.string().optional().transform(trimmed),
  APP_PASSWORD: z.string().optional().transform(trimmed),
  ALLOW_MANUAL_VERIFICATION: z.string().optional().transform(boolFlag),
  MANUAL_VERIFICATION_TIMEOUT_MS: z.coerce.number().positive().default(120_000),
  HIGHLIGHT_ELEMENTS: z.string().optional().transform(boolFlag),
  TRACE: z.string().optional().transform(boolFlag),
  SCREENSHOT_ON_FAILURE: z.string().optional().transform(boolTrue),
  ATTACH_SCREENSHOTS: z.string().optional().transform(boolFlag),
  RECORD_VIDEO: z.string().optional().transform(boolFlag),
  ALLURE_RESULTS_DIR: z
    .string()
    .optional()
    .transform((v) => {
      const value = trimmed(v);
      return value || "allure-results";
    }),
});

// ─── Validation (fail fast on bad values) ─────────────────────────────────────

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("\n❌ Invalid environment configuration:");
  for (const issue of parseResult.error.issues) {
    console.error(`   ${issue.path.join(".")} — ${issue.message}`);
  }
  console.error("\nCheck your .env file against .env.example and fix the above values.\n");
  process.exit(1);
}

const env = parseResult.data;

// ─── Dynamic URLs ─────────────────────────────────────────────────────────────

// Automatically extract any _URL variables from .env that aren't explicitly in the Zod schema
const dynamicUrls: Record<string, string> = {};
const schemaKeys = Object.keys(envSchema.shape);

for (const [key, value] of Object.entries(process.env)) {
  if (key && key.endsWith("_URL") && value && !schemaKeys.includes(key)) {
    const normalizedValue = value.trim();
    if (!normalizedValue) continue;

    // Convert NEW_PAGE_URL to newPageUrl for TypeScript
    const camelKey = key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    dynamicUrls[camelKey] = normalizedValue;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedBrowser = "chromium" | "firefox" | "webkit";

export interface RuntimeConfig {
  browser: SupportedBrowser;
  headless: boolean;
  maximizeBrowser: boolean;
  slowMo: number;
  timeoutMs: number;
  actionTimeoutMs: number;
  navigationTimeoutMs: number;
  baseUrl: string;
  loginUrl: string;
  username: string;
  password: string;
  allowManualVerification: boolean;
  manualVerificationTimeoutMs: number;
  highlightElements: boolean;
  trace: boolean;
  screenshotOnFailure: boolean;
  attachScreenshots: boolean;
  recordVideo: boolean;
  allureResultsDir: string;
  urls: Record<string, string>;
}

// ─── Exported config ──────────────────────────────────────────────────────────

export const runtimeConfig: RuntimeConfig = {
  browser: env.BROWSER,
  headless: env.HEADLESS,
  maximizeBrowser: env.MAXIMIZE_BROWSER,
  slowMo: env.SLOW_MO,
  timeoutMs: env.DEFAULT_TIMEOUT_MS,
  actionTimeoutMs: env.ACTION_TIMEOUT_MS,
  navigationTimeoutMs: env.NAVIGATION_TIMEOUT_MS,
  baseUrl: env.BASE_URL,
  loginUrl: env.LOGIN_URL,
  username: env.APP_USERNAME,
  password: env.APP_PASSWORD,
  allowManualVerification: env.ALLOW_MANUAL_VERIFICATION,
  manualVerificationTimeoutMs: env.MANUAL_VERIFICATION_TIMEOUT_MS,
  highlightElements: env.HIGHLIGHT_ELEMENTS,
  trace: env.TRACE,
  screenshotOnFailure: env.SCREENSHOT_ON_FAILURE,
  attachScreenshots: env.ATTACH_SCREENSHOTS,
  recordVideo: env.RECORD_VIDEO,
  allureResultsDir: env.ALLURE_RESULTS_DIR,
  urls: dynamicUrls,
};
