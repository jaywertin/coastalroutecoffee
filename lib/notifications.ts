import type { ShippoLabel, ShippoRecipient } from "@/lib/shippo";
import { getCommerceMode } from "@/lib/commerce";
import { FulfillmentConfigurationError } from "@/lib/fulfillment-store";

const MERCHANT_EMAIL = "coastalroutecoffee@gmail.com";
const REPLY_TO_EMAIL = "coastalroutecoffee@gmail.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

function addressHtml(address: ShippoRecipient) {
  return [address.name, address.street1, address.street2, `${address.city}, ${address.state} ${address.zip}`, address.country]
    .filter(Boolean)
    .map((line) => escapeHtml(String(line)))
    .join("<br>");
}

async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
  idempotencyKey,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], reply_to: REPLY_TO_EMAIL, subject, html }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    console.error("Fulfillment email failed", { status: response.status, recipient: to === MERCHANT_EMAIL ? "merchant" : "customer" });
    throw new Error("Fulfillment email could not be sent.");
  }
}

export async function sendOrderEmails({
  orderId,
  customerEmail,
  address,
  items,
  delivery,
  labels,
}: {
  orderId: string;
  customerEmail: string;
  address: ShippoRecipient;
  items: Array<{ name: string; quantity: number }>;
  delivery: string;
  labels: ShippoLabel[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const mode = getCommerceMode();
  if (!apiKey) throw new FulfillmentConfigurationError("Fulfillment email is not configured.");
  const from = process.env.FULFILLMENT_FROM_EMAIL ?? (mode === "live"
    ? "Coastal Route Coffee <orders@coastalroutecoffee.com>"
    : "Coastal Route Coffee <onboarding@resend.dev>");
  const modePrefix = mode === "sandbox" ? "[TEST] " : "";

  const itemRows = items.map(({ name, quantity }) => (
    `<li>${quantity} × ${escapeHtml(name)}</li>`
  )).join("");
  const labelRows = labels.length
    ? labels.map((label, index) => (
        `<li><a href="${escapeHtml(label.labelUrl)}">Download label ${index + 1}</a> — ${escapeHtml(label.trackingNumber)}</li>`
      )).join("")
    : "<li>No carrier label — free local delivery</li>";
  const trackingRows = labels.filter(({ trackingUrl }) => trackingUrl).length
    ? labels.filter(({ trackingUrl }) => trackingUrl).map((label, index) => (
        `<li><a href="${escapeHtml(label.trackingUrl)}">Track package ${index + 1}</a> — ${escapeHtml(label.trackingNumber)}</li>`
      )).join("")
    : "<li>No carrier tracking is needed for free local delivery.</li>";

  const deliveries = [sendEmail({
    apiKey,
    from,
    to: process.env.FULFILLMENT_EMAIL_TO ?? MERCHANT_EMAIL,
    subject: `${modePrefix}New Coastal Route Coffee order — ${orderId}`,
    idempotencyKey: `crc-${mode}-merchant-${orderId}`,
    html: `
        <h1>New ${mode === "sandbox" ? "sandbox " : ""}order</h1>
        <p><strong>Order:</strong> ${escapeHtml(orderId)}</p>
        <p><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>
        <p><strong>Delivery:</strong> ${escapeHtml(delivery)}</p>
        <h2>Items</h2><ul>${itemRows}</ul>
        <h2>Ship to</h2><p>${addressHtml(address)}</p>
        <h2>Fulfillment</h2><ul>${labelRows}</ul>
        ${mode === "sandbox" ? "<p>This is a Stripe and Shippo sandbox order. No real postage or payment was created.</p>" : ""}
      `,
  })];

  if (customerEmail.includes("@")) {
    deliveries.push(sendEmail({
      apiKey,
      from,
      to: customerEmail,
      subject: `${modePrefix}Your Coastal Route Coffee order is confirmed`,
      idempotencyKey: `crc-${mode}-customer-${orderId}`,
      html: `
        <h1>Your Coffee Is En Route!</h1>
        <p>Thanks for choosing Coastal Route Coffee. We received your order and will prepare it for delivery.</p>
        <h2>Your coffee</h2><ul>${itemRows}</ul>
        <p><strong>Delivery:</strong> ${escapeHtml(delivery)}</p>
        <h2>Deliver to</h2><p>${addressHtml(address)}</p>
        <h2>Tracking</h2><ul>${trackingRows}</ul>
        <p>Questions? Reply to this email or contact ${REPLY_TO_EMAIL}.</p>
        ${mode === "sandbox" ? "<p>This was a sandbox order. No real payment or postage was created.</p>" : ""}
      `,
    }));
  }

  await Promise.all(deliveries);
}

export async function sendSubscriptionCancellationEmail({
  eventId,
  customerEmail,
  cancellationDate,
}: {
  eventId: string;
  customerEmail: string;
  cancellationDate: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const mode = getCommerceMode();
  if (!apiKey) throw new FulfillmentConfigurationError("Subscription email is not configured.");
  const from = process.env.FULFILLMENT_FROM_EMAIL ?? (mode === "live"
    ? "Coastal Route Coffee <orders@coastalroutecoffee.com>"
    : "Coastal Route Coffee <onboarding@resend.dev>");
  const modePrefix = mode === "sandbox" ? "[TEST] " : "";

  await sendEmail({
    apiKey,
    from,
    to: customerEmail,
    subject: `${modePrefix}Your Coastal Route Coffee subscription cancellation is confirmed`,
    idempotencyKey: `crc-${mode}-subscription-cancellation-${eventId}`,
    html: `
      <h1>Your subscription cancellation is confirmed.</h1>
      <p>Your monthly coffee subscription is scheduled to end on <strong>${escapeHtml(cancellationDate)}</strong>.</p>
      <p>Your subscription remains active until then, and you will not be charged again.</p>
      <p>Changed your mind or need help? Reply to this email or contact ${REPLY_TO_EMAIL}.</p>
      ${mode === "sandbox" ? "<p>This was a sandbox subscription. No real payment was processed.</p>" : ""}
    `,
  });
}
