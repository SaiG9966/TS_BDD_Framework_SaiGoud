import type { Page } from "@playwright/test";
import type { RuntimeConfig } from "../config/runtimeConfig.ts";
import { PlaywrightAssertions } from "../utils/playwrightAssertions.ts";

export class basicControls_Page extends PlaywrightAssertions {
  constructor(page: Page, runtime: RuntimeConfig) {
    super(page, runtime);
  }

  firstnameInput = "input[id='firstName']";
  lastnameInput = "input[id='lastName']";
  maleGenderInput = "input[id='malerb']";
  femaleGenderInput = "input[id='femalerb']";
  englishLanguagesInput = "input[id='englishchbx']";
  hindiLanguagesInput = "input[id='hindichbx']";
  emailInput = "input[id='email']";
  passwordInput = "#password";
  registerButton = "#registerbtn";
  dashboardHeader = "h6:has-text('Dashboard')";

  async navigate() {
    await this.goto(this.runtime.urls.basicControlsUrl);
  }

  async enterFirstname(firstname: string) {
    await this.fillText(this.firstnameInput, firstname);
    this.highlight(this.firstnameInput);
    await this.W10();
  }

  async getFirstnameValue() {
    return this.getInputValue(this.firstnameInput);
    this.highlight(this.firstnameInput);
  }

  async enterlastName(lastname: string) {
    await this.fillText(this.lastnameInput, lastname);
    this.highlight(this.lastnameInput);
  }

  async getLastnameValue() {
    return this.getInputValue(this.lastnameInput);
    this.highlight(this.lastnameInput);
  }

  async enterPassword(password: string) {
    await this.fillText(this.passwordInput, password);
    this.highlight(this.passwordInput);
  }
  async selectGender(gender: string) {
    const normalizedGender = gender.toLowerCase().trim();
    const selector = normalizedGender === "female" ? this.femaleGenderInput : this.maleGenderInput;
    await this.check(selector);
    this.highlight(selector);
  }
  async verifyGenderSelection(gender: string): Promise<string> {
    const normalizedGender = gender.toLowerCase().trim();
    const selector = normalizedGender === "female" ? this.femaleGenderInput : this.maleGenderInput;
    const checked = await this.isChecked(selector);
    return checked ? normalizedGender : "";
  }
  async selectLanguages(languages: string[]) {
    for (const language of languages) {
      let languageInput;

      if (language.toLowerCase() === "english") {
        languageInput = this.englishLanguagesInput;
      }

      if (language.toLowerCase() === "hindi") {
        languageInput = this.hindiLanguagesInput;
      }

      if (languageInput) {
        await this.check(languageInput);
        this.highlight(languageInput);
      }
    }
  }

  async getSelectedLanguages() {
    const selectedLanguages = [];

    if (await this.isChecked(this.englishLanguagesInput)) {
      selectedLanguages.push("English");
    }
    if (await this.isChecked(this.hindiLanguagesInput)) {
      selectedLanguages.push("Hindi");
    }
    return selectedLanguages;
  }

  async enterEmail(email: string) {
    await this.fillText(this.emailInput, email);
  }

  async getEmailValue() {
    return this.getInputValue(this.emailInput);
  }

  async enterpassword(password: string) {
    await this.fillText(this.passwordInput, password);
    this.highlight(this.passwordInput);
  }

  async getPasswordValue() {
    return this.getInputValue(this.passwordInput);
  }

  async registerbutton() {
    await this.scrollIntoView(this.registerButton);
    await this.click(this.registerButton);
    await this.highlight(this.registerButton);
    await this.screenshot("register_button.png");
  }
}
