import assert from "node:assert/strict";
import test from "node:test";
import { getCommerceMode, getModeCredential } from "./commerce.ts";

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

test("uses the sandbox credential by default", () => {
  const originalMode = process.env.COMMERCE_MODE;
  const originalSandbox = process.env.TEST_SANDBOX_KEY;
  delete process.env.COMMERCE_MODE;
  process.env.TEST_SANDBOX_KEY = "sandbox-value";
  try {
    assert.deepEqual(getModeCredential("TEST_SANDBOX_KEY", "TEST_LIVE_KEY"), {
      mode: "sandbox",
      name: "TEST_SANDBOX_KEY",
      value: "sandbox-value",
    });
  } finally {
    if (originalMode === undefined) delete process.env.COMMERCE_MODE;
    else process.env.COMMERCE_MODE = originalMode;
    if (originalSandbox === undefined) delete process.env.TEST_SANDBOX_KEY;
    else process.env.TEST_SANDBOX_KEY = originalSandbox;
  }
});

test("keeps live credentials separate from sandbox credentials", () => {
  const originalMode = process.env.COMMERCE_MODE;
  const originalLive = process.env.TEST_LIVE_KEY;
  process.env.COMMERCE_MODE = "live";
  process.env.TEST_LIVE_KEY = "live-value";
  try {
    assert.deepEqual(getModeCredential("TEST_SANDBOX_KEY", "TEST_LIVE_KEY"), {
      mode: "live",
      name: "TEST_LIVE_KEY",
      value: "live-value",
    });
  } finally {
    if (originalMode === undefined) delete process.env.COMMERCE_MODE;
    else process.env.COMMERCE_MODE = originalMode;
    if (originalLive === undefined) delete process.env.TEST_LIVE_KEY;
    else process.env.TEST_LIVE_KEY = originalLive;
  }
});
