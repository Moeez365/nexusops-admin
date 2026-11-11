import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_TIERS,
  INITIAL_CUSTOMER_FORM,
  buildCustomerPayload,
  evaluateCustomerReadiness,
  getCustomerInitials,
  mapUserToForm,
} from "../customerForm.js";

describe("getCustomerInitials", () => {
  it("extracts first and last initials for multi-word names", () => {
    assert.equal(getCustomerInitials("Sophia Laurent"), "SL");
    assert.equal(getCustomerInitials("  Jean   Luc  Picard "), "JP");
  });

  it("extracts up to two uppercase characters for single-word names", () => {
    assert.equal(getCustomerInitials("Madonna"), "MA");
    assert.equal(getCustomerInitials("A"), "A");
  });

  it("falls back to question marks when name is blank", () => {
    assert.equal(getCustomerInitials("   "), "??");
    assert.equal(getCustomerInitials(null), "??");
  });
});

describe("evaluateCustomerReadiness", () => {
  it("requires valid name, email, and 6+ char password on create", () => {
    assert.deepEqual(
      evaluateCustomerReadiness({
        name: "Sophia Laurent",
        email: "sophia@example.com",
        password: "secret",
      }),
      {
        hasValidName: true,
        hasValidEmail: true,
        hasValidPassword: true,
        hasRequiredFields: true,
      }
    );
  });

  it("rejects short names, overlong names, invalid emails, and short passwords", () => {
    assert.equal(
      evaluateCustomerReadiness({
        name: "A",
        email: "sophia@example.com",
        password: "secret",
      }).hasValidName,
      false
    );

    assert.equal(
      evaluateCustomerReadiness({
        name: "A".repeat(101),
        email: "sophia@example.com",
        password: "secret",
      }).hasValidName,
      false
    );

    assert.equal(
      evaluateCustomerReadiness({
        name: "Sophia",
        email: "invalid-email",
        password: "secret",
      }).hasValidEmail,
      false
    );

    assert.equal(
      evaluateCustomerReadiness({
        name: "Sophia",
        email: "sophia@example.com",
        password: "12345",
      }).hasRequiredFields,
      false
    );
  });

  it("allows blank password in edit mode but validates non-empty passwords", () => {
    assert.equal(
      evaluateCustomerReadiness(
        {
          name: "Sophia Laurent",
          email: "sophia@example.com",
          password: "",
        },
        { isEditMode: true }
      ).hasRequiredFields,
      true
    );

    assert.equal(
      evaluateCustomerReadiness(
        {
          name: "Sophia Laurent",
          email: "sophia@example.com",
          password: "123",
        },
        { isEditMode: true }
      ).hasRequiredFields,
      false
    );
  });
});

describe("buildCustomerPayload", () => {
  it("normalizes scalar fields and includes primary default address when filled", () => {
    const payload = buildCustomerPayload({
      ...INITIAL_CUSTOMER_FORM,
      name: "  Sophia Laurent  ",
      email: "  Sophia@Example.COM ",
      password: "secret!",
      phone: " +33 6 40 92 11 88 ",
      location: " Paris, France ",
      tier: "VIP",
      isActive: true,
      isEmailVerified: true,
      street: " 24 Rue du Faubourg ",
      city: " Paris ",
      postalCode: " 75008 ",
      country: " France ",
    });

    assert.deepEqual(payload, {
      name: "Sophia Laurent",
      email: "sophia@example.com",
      password: "secret!",
      phone: "+33 6 40 92 11 88",
      location: "Paris, France",
      avatar: "",
      tier: "VIP",
      isActive: true,
      isEmailVerified: true,
      addresses: [
        {
          street: "24 Rue du Faubourg",
          city: "Paris",
          state: "",
          postalCode: "75008",
          country: "France",
          isDefault: true,
        },
      ],
    });
  });

  it("omits password when blank, resets invalid tier, and clears addresses only in edit mode", () => {
    const createPayload = buildCustomerPayload(
      {
        ...INITIAL_CUSTOMER_FORM,
        name: "Elena",
        email: "elena@example.com",
        password: "",
        tier: "UnknownTier",
      },
      { isEditMode: false }
    );

    assert.equal("password" in createPayload, false);
    assert.equal("addresses" in createPayload, false);
    assert.equal(createPayload.tier, CUSTOMER_TIERS[2]);

    const editPayload = buildCustomerPayload(
      {
        ...INITIAL_CUSTOMER_FORM,
        name: "Elena",
        email: "elena@example.com",
      },
      { isEditMode: true }
    );

    assert.deepEqual(editPayload.addresses, []);
  });
});

describe("mapUserToForm", () => {
  it("prefers the default address and clears password for edit hydration", () => {
    const mapped = mapUserToForm({
      name: "Marcus",
      email: "marcus@example.com",
      phone: "123456",
      tier: "Active",
      isActive: false,
      isEmailVerified: true,
      addresses: [
        { street: "Secondary St", city: "Lyon", isDefault: false },
        {
          street: "Primary Ave",
          city: "Paris",
          state: "IDF",
          postalCode: "75001",
          country: "France",
          isDefault: true,
        },
      ],
    });

    assert.deepEqual(mapped, {
      name: "Marcus",
      email: "marcus@example.com",
      password: "",
      phone: "123456",
      location: "",
      avatar: "",
      tier: "Active",
      isActive: false,
      isEmailVerified: true,
      street: "Primary Ave",
      city: "Paris",
      state: "IDF",
      postalCode: "75001",
      country: "France",
    });
  });
});

