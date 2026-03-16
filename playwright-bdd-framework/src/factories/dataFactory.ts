import { faker } from "@faker-js/faker";

/**
 * TestDataFactory — generates random, realistic test data.
 * Use this to avoid hardcoded values in feature files and step definitions.
 *
 * Usage:
 *   import { TestDataFactory as TDF } from "../factories/dataFactory.ts";
 *   const name  = TDF.firstName();
 *   const email = TDF.email();
 *   const user  = TDF.fullUser();  // complete object
 */
export class TestDataFactory {
  // ─── Person ──────────────────────────────────────────────────────────────────

  static firstName(gender?: "male" | "female"): string {
    return faker.person.firstName(gender);
  }

  static lastName(): string {
    return faker.person.lastName();
  }

  static fullName(gender?: "male" | "female"): string {
    return `${TestDataFactory.firstName(gender)} ${TestDataFactory.lastName()}`;
  }

  // ─── Contact ─────────────────────────────────────────────────────────────────

  static email(prefix?: string): string {
    const base = prefix ?? faker.internet.username();
    return `${base}.test.${faker.number.int({ min: 100, max: 9999 })}@mailtest.dev`;
  }

  static phone(): string {
    return faker.phone.number({ style: "national" });
  }

  // ─── Credentials ─────────────────────────────────────────────────────────────

  /**
   * Generates a strong password meeting most common requirements:
   * uppercase, lowercase, digit, special char, minimum 10 chars.
   */
  static password(length = 12): string {
    const upper = faker.string.alpha({ length: 2, casing: "upper" });
    const lower = faker.string.alpha({ length: length - 5, casing: "lower" });
    const digits = faker.string.numeric(2);
    const special = faker.helpers.arrayElement(["@", "!", "#", "$", "%"]);
    const mixed = (upper + lower + digits + special).split("");
    faker.helpers.shuffle(mixed);
    return mixed.join("");
  }

  static username(): string {
    return faker.internet
      .username()
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 16);
  }

  // ─── Address ─────────────────────────────────────────────────────────────────

  static street(): string {
    return faker.location.streetAddress();
  }

  static city(): string {
    return faker.location.city();
  }

  static zipCode(): string {
    return faker.location.zipCode();
  }

  static country(): string {
    return faker.location.country();
  }

  // ─── Misc ─────────────────────────────────────────────────────────────────────

  static company(): string {
    return faker.company.name();
  }

  static uuid(): string {
    return faker.string.uuid();
  }

  static number(min = 1, max = 100): number {
    return faker.number.int({ min, max });
  }

  static alphanumeric(length = 8): string {
    return faker.string.alphanumeric(length);
  }

  static pastDate(): Date {
    return faker.date.past({ years: 2 });
  }

  static futureDate(): Date {
    return faker.date.future({ years: 2 });
  }

  // ─── Composite objects ────────────────────────────────────────────────────────

  static fullUser(gender?: "male" | "female"): {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    username: string;
  } {
    const firstName = TestDataFactory.firstName(gender);
    const lastName = TestDataFactory.lastName();
    return {
      firstName,
      lastName,
      email: TestDataFactory.email(firstName.toLowerCase()),
      password: TestDataFactory.password(),
      phone: TestDataFactory.phone(),
      username: TestDataFactory.username(),
    };
  }

  static address(): {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  } {
    return {
      street: TestDataFactory.street(),
      city: TestDataFactory.city(),
      zipCode: TestDataFactory.zipCode(),
      country: TestDataFactory.country(),
    };
  }
}
