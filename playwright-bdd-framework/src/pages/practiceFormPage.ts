import type { Page } from "@playwright/test";
import type { RuntimeConfig } from "../config/runtimeConfig.ts";
import { PlaywrightActions } from "../utils/playwrightActions.ts";

export class PracticeFormPage extends PlaywrightActions {
  constructor(page: Page, runtime: RuntimeConfig) {
    super(page, runtime);
  }

  firstNameInput = "#firstName";
  lastNameInput = "#lastName";
  emailInput = "#userEmail";
  mobileInput = "#userNumber";
  dobInput = "#dateOfBirthInput";
  yearSelect = ".react-datepicker__year-select";
  monthSelect = ".react-datepicker__month-select";
  subjectInput = "#subjectsInput";
  uploadInput = "#uploadPicture";
  addressInput = "#currentAddress";
  stateDropdown = "#state";
  cityDropdown = "#city";
  submitButton = "#submit";
  successTitle = "#example-modal-sizes-title-lg";
  sportsHobbyInput = "#hobbies-checkbox-1";
  readingHobbyInput = "#hobbies-checkbox-2";
  musicHobbyInput = "#hobbies-checkbox-3";

  async navigate() {
    await this.goto(this.runtime.urls.practiceFormUrl);
  }

  async enterFirstName(firstName: string) {
    await this.fillText(this.firstNameInput, firstName);
  }

  async enterLastName(lastName: string) {
    await this.fillText(this.lastNameInput, lastName);
  }

  async enterEmail(email: string) {
    await this.fillText(this.emailInput, email);
  }

  async selectGender(gender: string) {
    await this.click(`//label[text()='${gender}']`);
  }

  async enterMobile(mobile: string) {
    await this.fillText(this.mobileInput, mobile);
  }

  async selectDOB() {
    await this.click(this.dobInput);
    await this.select(this.yearSelect, "2026");
    await this.select(this.monthSelect, "2");
    await this.click("//div[text()='16']");
  }

  async enterSubject(subject: string) {
    await this.fillText(this.subjectInput, subject);
    await this.page.keyboard.press("Enter");
  }

  async selectHobby(hobby: string) {
    const normalizedHobby = hobby.toLowerCase().trim();

    const hobbySelectorMap: Record<string, string> = {
      sports: this.sportsHobbyInput,
      reading: this.readingHobbyInput,
      music: this.musicHobbyInput,
    };

    const selector = hobbySelectorMap[normalizedHobby];

    if (!selector) {
      throw new Error(`Unsupported hobby value: '${hobby}'. Supported values: Sports, Reading, Music.`);
    }

    const input = this.page.locator(selector);
    const label = this.page.locator(`label[for='${selector.replace("#", "")}']`);

    await input.scrollIntoViewIfNeeded();

    // 1) Try regular Playwright check first
    try {
      await input.check({ force: true });
    } catch {
      // ignore and fallback below
    }

    if (await input.isChecked()) {
      return;
    }

    // 2) Fallback: click mapped label (some pages wire label click handlers)
    try {
      await label.click({ force: true });
    } catch {
      // ignore and fallback below
    }

    if (await input.isChecked()) {
      return;
    }

    // 3) Final fallback: set state through DOM and dispatch events
    await input.evaluate((el: HTMLInputElement) => {
      el.checked = true;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    if (!(await input.isChecked())) {
      throw new Error(`Failed to select hobby '${hobby}' using all fallback strategies.`);
    }
  }

  async uploadPicture(filePath: string) {
    await this.uploadFile(this.uploadInput, filePath);
  }

  async enterAddress(address: string) {
    await this.fillText(this.addressInput, address);
  }

  async selectState(state: string) {
    await this.click(this.stateDropdown);
    await this.click(`//div[text()='${state}']`);
  }

  async selectCity(city: string) {
    await this.click(this.cityDropdown);
    await this.click(`//div[text()='${city}']`);
  }

  async clickSubmit() {
    await this.click(this.submitButton);
  }

  async verifySubmission() {
    await this.waitForVisible(this.successTitle);
  }
}
