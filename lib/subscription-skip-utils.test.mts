import assert from "node:assert/strict";
import test from "node:test";
import { getNextSubscriptionRenewal, getSkipResumeTimestamp } from "./subscription-skip-utils.ts";

function subscription(...periodEnds: number[]) {
  return { items: { data: periodEnds.map((current_period_end) => ({ current_period_end })) } } as never;
}

test("uses the earliest subscription item renewal", () => {
  assert.equal(getNextSubscriptionRenewal(subscription(2_000, 1_900)), 1_900);
});

test("resumes collection one day after the skipped renewal", () => {
  assert.equal(getSkipResumeTimestamp(subscription(200_000), 100_000), 286_400);
});

test("rejects skips inside the twelve-hour preparation window", () => {
  assert.throws(() => getSkipResumeTimestamp(subscription(110_000), 100_000), /already being prepared/);
});
