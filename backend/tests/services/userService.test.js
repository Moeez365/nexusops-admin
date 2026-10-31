import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchUserById,
  createUserAccount,
  updateUserDetails,
  removeUserAccount,
} from "../../src/services/userService.js";

test("fetchUserById throws a 400 error when given an invalid ObjectId", async () => {
  await assert.rejects(
    async () => {
      await fetchUserById("invalid-id-123");
    },
    (err) => err.statusCode === 400 && err.message === "Invalid user ID"
  );
});

test("createUserAccount throws a 400 error when email is missing", async () => {
  await assert.rejects(
    async () => {
      await createUserAccount({ name: "Alex Mercer" });
    },
    (err) => err.statusCode === 400 && err.message === "Email is required"
  );
});

test("updateUserDetails throws a 400 error when given an invalid ObjectId", async () => {
  await assert.rejects(
    async () => {
      await updateUserDetails("bad-id", { name: "Updated Name" });
    },
    (err) => err.statusCode === 400 && err.message === "Invalid user ID"
  );
});

test("removeUserAccount throws a 400 error when given an invalid ObjectId", async () => {
  await assert.rejects(
    async () => {
      await removeUserAccount("bad-id");
    },
    (err) => err.statusCode === 400 && err.message === "Invalid user ID"
  );
});

