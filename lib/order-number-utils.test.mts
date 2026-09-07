import assert from "node:assert/strict";
import test from "node:test";
import { FIRST_ORDER_NUMBER, formatOrderNumber } from "./order-number-utils.ts";

test("starts customer-facing order numbers at 2500", () => {
  assert.equal(FIRST_ORDER_NUMBER, 2500);
  assert.equal(formatOrderNumber(FIRST_ORDER_NUMBER), "#2500");
  assert.equal(formatOrderNumber(FIRST_ORDER_NUMBER + 1), "#2501");
});
