import type Stripe from "stripe";
import { isLiveCommerce } from "@/lib/commerce";
import {
  acquireFulfillmentLock,
  completeFulfillment,
  releaseFulfillmentLock,
} from "@/lib/fulfillment-store";
import { sendSubscriptionCancellationEmail } from "@/lib/notifications";
import { getStripe } from "@/lib/stripe";
import { getScheduledCancellationDate } from "@/lib/subscription-cancellation-utils";

export async function notifyScheduledSubscriptionCancellation({
  eventId,
  subscription,
  fulfillmentVersion,
}: {
  eventId: string;
  subscription: Stripe.Subscription;
  fulfillmentVersion: string;
}) {
  if (subscription.livemode !== isLiveCommerce()) return;
  if (subscription.metadata.fulfillmentVersion !== fulfillmentVersion) return;

  const notificationId = `subscription-cancellation:${eventId}`;
  const acquired = await acquireFulfillmentLock(notificationId);
  if (!acquired) {
    console.info("Subscription cancellation email already handled", { eventId, subscriptionId: subscription.id });
    return;
  }

  try {
    const customer = typeof subscription.customer === "string"
      ? await getStripe().customers.retrieve(subscription.customer)
      : subscription.customer;
    if (customer.deleted || !customer.email) {
      console.warn("Subscription cancellation email skipped because the customer has no email", {
        eventId,
        subscriptionId: subscription.id,
      });
      await completeFulfillment(notificationId, { status: "skipped", reason: "missing-customer-email" });
      return;
    }

    const cancellationDate = getScheduledCancellationDate(subscription);
    await sendSubscriptionCancellationEmail({ eventId, customerEmail: customer.email, cancellationDate });
    await completeFulfillment(notificationId, { status: "completed", cancellationDate });
    console.info("Subscription cancellation email sent", { eventId, subscriptionId: subscription.id });
  } catch (error) {
    await releaseFulfillmentLock(notificationId).catch(() => undefined);
    throw error;
  }
}
