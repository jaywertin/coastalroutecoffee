import assert from "node:assert/strict";
import test from "node:test";
import {
  getScheduledCancellationDate,
  isNewScheduledCancellation,
} from "./subscription-cancellation-utils.ts";

test("recognizes a newly scheduled end-of-period cancellation", () => {
  assert.equal(isNewScheduledCancellation(
    { cancel_at_period_end: true },
    { cancel_at_period_end: false },
  ), true);
  assert.equal(isNewScheduledCancellation(
    { cancel_at_period_end: true },
    { cancel_at_period_end: true },
  ), false);
  assert.equal(isNewScheduledCancellation(
    { cancel_at_period_end: false },
    { cancel_at_period_end: true },
  ), false);
});

test("formats the scheduled cancellation date in UTC", () => {
  assert.equal(getScheduledCancellationDate({
    cancel_at: 1_791_003_600,
    items: { data: [] },
  } as never), "October 3, 2026");
});

test("falls back to the latest subscription item period end", () => {
  assert.equal(getScheduledCancellationDate({
    cancel_at: null,
    items: {
      data: [
        { current_period_end: 1_791_003_600 },
        { current_period_end: 1_791_003_600 },
      ],
    },
  } as never), "October 3, 2026");
});
