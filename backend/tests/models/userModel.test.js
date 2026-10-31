import test from "node:test";
import assert from "node:assert/strict";
import User, { USER_ROLES, CUSTOMER_TIERS } from "../../src/models/userModel.js";

test("USER_ROLES contains administrative and customer roles", () => {
  assert.ok(USER_ROLES.includes("admin"));
  assert.ok(USER_ROLES.includes("manager"));
  assert.ok(USER_ROLES.includes("staff"));
  assert.ok(USER_ROLES.includes("customer"));
});

test("CUSTOMER_TIERS matches luxury frontend customer tiers", () => {
  assert.ok(CUSTOMER_TIERS.includes("VIP"));
  assert.ok(CUSTOMER_TIERS.includes("Active"));
  assert.ok(CUSTOMER_TIERS.includes("New"));
});

test("User schema validates required fields (name, email, password)", () => {
  const invalidUser = new User({});
  const validationError = invalidUser.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.name);
  assert.ok(validationError.errors.email);
  assert.ok(validationError.errors.password);
});

test("User schema rejects invalid email format", () => {
  const userWithBadEmail = new User({
    name: "John Doe",
    email: "not-an-email",
    password: "securePassword123",
  });
  const validationError = userWithBadEmail.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.email);
});

test("User schema computes 'initials' virtual properly", () => {
  const user = new User({
    name: "Sophia Laurent",
    email: "s.laurent@paris.luxury",
    password: "securePassword123",
  });

  assert.strictEqual(user.initials, "SL");
});

test("User schema defaults to role 'customer' and tier 'New'", () => {
  const user = new User({
    name: "Elena Dubois",
    email: "e.dubois@maison.fr",
    password: "securePassword123",
  });

  assert.strictEqual(user.role, "customer");
  assert.strictEqual(user.tier, "New");
  assert.strictEqual(user.isActive, true);
  assert.strictEqual(user.totalSpent, 0);
  assert.strictEqual(user.ordersCount, 0);
});

