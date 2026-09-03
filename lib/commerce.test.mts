import assert from "node:assert/strict";
import test from "node:test";
import { getCommerceMode } from "./commerce.ts";

test("defaults commerce to sandbox mode", () => {
  const original = process.env.COMMERCE_MODE;
  delete process.env.COMMERCE_MODE;
  try {
    assert.equal(getCommerceMode(), "sandbox");
  } finally {
    if (original === undefined) delete process.env.COMMERCE_MODE;
    else process.env.COMMERCE_MODE = original;
  }
});

test("accepts the explicit live mode", () => {
  const original = process.env.COMMERCE_MODE;
  process.env.COMMERCE_MODE = "live";
  try {
    assert.equal(getCommerceMode(), "live");
  } finally {
    if (original === undefined) delete process.env.COMMERCE_MODE;
    else process.env.COMMERCE_MODE = original;
  }
});

test("rejects an unknown commerce mode", () => {
  const original = process.env.COMMERCE_MODE;
  process.env.COMMERCE_MODE = "production";
  try {
    assert.throws(() => getCommerceMode(), /sandbox or live/);
  } finally {
    if (original === undefined) delete process.env.COMMERCE_MODE;
    else process.env.COMMERCE_MODE = original;
  }
});
