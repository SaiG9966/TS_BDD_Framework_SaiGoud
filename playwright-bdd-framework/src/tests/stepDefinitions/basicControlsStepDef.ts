import { Before, When, Then, Given } from "@cucumber/cucumber";
import type { CustomWorld } from "../support/customWorld.js";
import { basicControls_Page } from "../../pages/basicControlsPage.ts";
import { TestDataFactory as TDF } from "../../factories/dataFactory.ts";

let basicControlsPage: basicControls_Page;


// Initialize basicControlsPage before steps
Before(async function (this: CustomWorld) {
  basicControlsPage = new basicControls_Page(this.page, this.runtime);
});

// Auto-generated step definitions from basicControls.feature
Given("user is on the registration page", async function (this: CustomWorld) {
  await basicControlsPage.navigate();
});

When("user enters first name {string}", async function (this: CustomWorld, arg1: string) {
  const firstName = arg1 === "faker" ? TDF.firstName() : arg1;
  await basicControlsPage.enterFirstname(firstName);
});

When("user enters last name {string}", async function (this: CustomWorld, arg1: string) {
  const lastName = arg1 === "faker" ? TDF.lastName() : arg1;
  await basicControlsPage.enterlastName(lastName);
});

When("user selects gender {string}", async function (this: CustomWorld, arg1: string) {
  const normalizedValue = arg1.toLowerCase();

  const randomGender = ["Male", "Female", "Other"][
    Math.floor(Math.random() * 3)
  ];

  const value =
    normalizedValue === "faker" || normalizedValue === "random"
      ? randomGender
      : arg1;

  await basicControlsPage.selectGender(value);
});


When(
  "user selects languages {string} and {string}",
  async function (this: CustomWorld, arg1: string, arg2: string) {
    await basicControlsPage.selectLanguages([arg1, arg2]);
  }
);

When("user enters email {string}", async function (this: CustomWorld, arg1: string) {
  const email = arg1 === "faker" ? TDF.email() : arg1;
  await basicControlsPage.enterEmail(email);
});

When("user enters password {string}", async function (this: CustomWorld, arg1: string) {
  const password = arg1 === "faker" ? TDF.password() : arg1;
  await basicControlsPage.enterPassword(password);
});

When("user clicks on Register button", async function (this: CustomWorld) {
  await basicControlsPage.registerbutton();
});

Then("user should be successfully registered", async function (this: CustomWorld) {});
