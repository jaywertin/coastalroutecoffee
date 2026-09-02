import type { ShippoLabel, ShippoRecipient } from "@/lib/shippo";
import { FulfillmentConfigurationError } from "@/lib/fulfillment-store";

const MERCHANT_EMAIL = "coastalroutecoffee@gmail.com";

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

export async function sendFulfillmentEmail({
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
  if (!apiKey) throw new FulfillmentConfigurationError("Sandbox fulfillment email is not configured.");

  const itemRows = items.map(({ name, quantity }) => (
    `<li>${quantity} × ${escapeHtml(name)}</li>`
  )).join("");
  const labelRows = labels.length
    ? labels.map((label, index) => (
        `<li><a href="${escapeHtml(label.labelUrl)}">Download test label ${index + 1}</a> — ${escapeHtml(label.trackingNumber)}</li>`
      )).join("")
    : "<li>No carrier label — free local delivery</li>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FULFILLMENT_FROM_EMAIL ?? "Coastal Route Coffee <onboarding@resend.dev>",
      to: [process.env.FULFILLMENT_EMAIL_TO ?? MERCHANT_EMAIL],
      subject: `[TEST] New Coastal Route Coffee order — ${orderId}`,
      html: `
        <h1>New sandbox order</h1>
        <p><strong>Order:</strong> ${escapeHtml(orderId)}</p>
        <p><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>
        <p><strong>Delivery:</strong> ${escapeHtml(delivery)}</p>
        <h2>Items</h2><ul>${itemRows}</ul>
        <h2>Ship to</h2><p>${addressHtml(address)}</p>
        <h2>Fulfillment</h2><ul>${labelRows}</ul>
        <p>This is a Stripe and Shippo sandbox order. No real postage or payment was created.</p>
      `,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    console.error("Sandbox fulfillment email failed", { status: response.status });
    throw new Error("Sandbox fulfillment email could not be sent.");
  }
}
