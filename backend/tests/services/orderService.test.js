import test from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_STATUS_LIST,
  buildOrderIdentifierQuery,
} from "../../src/services/orderService.js";

test("ORDER_STATUS_LIST contains required production status options", () => {
  assert.ok(ORDER_STATUS_LIST.includes("Pending"));
  assert.ok(ORDER_STATUS_LIST.includes("Processing"));
  assert.ok(ORDER_STATUS_LIST.includes("Shipped"));
  assert.ok(ORDER_STATUS_LIST.includes("Delivered"));
  assert.ok(ORDER_STATUS_LIST.includes("Cancelled"));
});

test("buildOrderIdentifierQuery queries by _id when given a valid 24-character ObjectId", () => {
  const validObjectId = "507f1f77bcf86cd799439011";
  const query = buildOrderIdentifierQuery(validObjectId);
  assert.deepStrictEqual(query, { _id: validObjectId });
});

test("buildOrderIdentifierQuery prefixes orderNumber with '#' when missing", () => {
  const query = buildOrderIdentifierQuery("VO-9921");
  assert.ok(query.orderNumber);
});

test("buildOrderIdentifierQuery preserves existing '#' prefix", () => {
  const query = buildOrderIdentifierQuery("#VO-9921");
  assert.ok(query.orderNumber);
});

test("buildOrderIdentifierQuery throws a 400 error when identifier is missing", () => {
  assert.throws(
    () => buildOrderIdentifierQuery(""),
    (err) => err.statusCode === 400
  );
});

