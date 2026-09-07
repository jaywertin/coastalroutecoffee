import type { ShippoLabel, ShippoRecipient } from "@/lib/shippo";
import { getCommerceMode } from "@/lib/commerce";
import { FulfillmentConfigurationError } from "@/lib/fulfillment-store";
import { formatOrderNumber } from "@/lib/order-number-utils";
import { CUSTOMER_PORTAL_URL, WEBSITE_URL } from "@/lib/site";

const MERCHANT_EMAIL = "coastalroutecoffee@gmail.com";
const REPLY_TO_EMAIL = "coastalroutecoffee@gmail.com";
const LOGO_URL = "https://coastalroutecoffee.com/images/coastal-route-badge.png";

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

function brandedEmail({
  eyebrow,
  title,
  introduction,
  content,
  ctaLabel = "Visit Coastal Route Coffee",
  ctaHref = WEBSITE_URL,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  content: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#f4eee2;color:#10293a;font-family:Arial,Helvetica,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(introduction)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eee2;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffdf8;border:1px solid #e6ddce;border-radius:22px;overflow:hidden;">
              <tr>
                <td align="center" style="background:#10293a;padding:28px 24px 24px;">
                  <a href="${WEBSITE_URL}" style="text-decoration:none;">
                    <img src="${LOGO_URL}" width="84" height="84" alt="Coastal Route Coffee" style="display:block;border:0;width:84px;height:84px;margin:0 auto 14px;" />
                    <span style="display:block;color:#fffdf8;font-size:15px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Coastal Route Coffee</span>
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 42px 36px;">
                  <p style="margin:0 0 12px;color:#a66820;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
                  <h1 style="margin:0 0 18px;color:#10293a;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.15;font-weight:700;">${escapeHtml(title)}</h1>
                  <p style="margin:0 0 28px;color:#52636d;font-size:16px;line-height:1.7;">${escapeHtml(introduction)}</p>
                  ${content}
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:30px;">
                    <tr>
                      <td style="background:#10293a;border-radius:999px;">
                        <a href="${ctaHref}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-decoration:none;text-transform:uppercase;">${escapeHtml(ctaLabel)}</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:30px 0 0;color:#7b888f;font-size:13px;line-height:1.6;">Questions? Reply to this email or contact <a href="mailto:${REPLY_TO_EMAIL}" style="color:#a66820;">${REPLY_TO_EMAIL}</a>.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="border-top:1px solid #e6ddce;padding:20px 24px;color:#7b888f;font-size:12px;letter-spacing:1px;">
                  The Road to Better Coffee · Roasted in San Clemente, California
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
  idempotencyKey,
  replyTo = REPLY_TO_EMAIL,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  replyTo?: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    console.error("Fulfillment email failed", { status: response.status, recipient: to === MERCHANT_EMAIL ? "merchant" : "customer" });
    throw new Error("Fulfillment email could not be sent.");
  }
}

export async function sendContactEmails({
  inquiryId,
  name,
  email,
  orderNumber,
  subject,
  message,
}: {
  inquiryId: string;
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const mode = getCommerceMode();
  if (!apiKey) throw new FulfillmentConfigurationError("Contact email is not configured.");
  const from = process.env.FULFILLMENT_FROM_EMAIL ?? (mode === "live"
    ? "Coastal Route Coffee <orders@coastalroutecoffee.com>"
    : "Coastal Route Coffee <onboarding@resend.dev>");
  const modePrefix = mode === "sandbox" ? "[TEST] " : "";
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  await Promise.all([
    sendEmail({
      apiKey,
      from,
      to: process.env.FULFILLMENT_EMAIL_TO ?? MERCHANT_EMAIL,
      replyTo: email,
      subject: `${modePrefix}Website question from ${name}: ${subject}`,
      idempotencyKey: `crc-${mode}-contact-merchant-${inquiryId}`,
      html: brandedEmail({
        eyebrow: "Website inquiry",
        title: "A customer has a question.",
        introduction: `${name} sent a message through the Coastal Route Coffee website. Reply to this email to respond directly.`,
        ctaLabel: "Open the storefront",
        content: `
          <div style="border-top:1px solid #e6ddce;border-bottom:1px solid #e6ddce;padding:22px 0;color:#334955;font-size:14px;line-height:1.7;">
            <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color:#a66820;">${escapeHtml(email)}</a></p>
            ${orderNumber ? `<p style="margin:0 0 8px;"><strong>Order number:</strong> ${escapeHtml(orderNumber)}</p>` : ""}
            <p style="margin:0;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          </div>
          <h2 style="margin:26px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Message</h2>
          <p style="margin:0;color:#334955;font-size:15px;line-height:1.8;">${safeMessage}</p>
        `,
      }),
    }),
    sendEmail({
      apiKey,
      from,
      to: email,
      subject: `${modePrefix}We received your Coastal Route Coffee question`,
      idempotencyKey: `crc-${mode}-contact-customer-${inquiryId}`,
      html: brandedEmail({
        eyebrow: "Message received",
        title: `Thanks for reaching out, ${name}.`,
        introduction: "Your note made it to us. We’ll read it carefully and reply as soon as we can.",
        ctaLabel: "Visit the coffee shop",
        content: `
          <div style="padding:20px;background:#f4eee2;border-left:4px solid #c49a4a;border-radius:10px;color:#334955;font-size:15px;line-height:1.7;">
            <strong>Your question:</strong><br>${safeMessage}
          </div>
          <p style="margin:24px 0 0;color:#52636d;font-size:15px;line-height:1.7;">If you need to add anything, simply reply to this email.</p>
        `,
      }),
    }),
  ]);
}

export async function sendOrderEmails({
  orderId,
  orderNumber,
  customerEmail,
  address,
  items,
  delivery,
  labels,
}: {
  orderId: string;
  orderNumber: number;
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
  const includesSubscription = items.some(({ name }) => /monthly|subscription/i.test(name));
  const displayOrderNumber = formatOrderNumber(orderNumber);

  const deliveries = [sendEmail({
    apiKey,
    from,
    to: process.env.FULFILLMENT_EMAIL_TO ?? MERCHANT_EMAIL,
    subject: `${modePrefix}New Coastal Route Coffee order ${displayOrderNumber}`,
    idempotencyKey: `crc-${mode}-merchant-${orderId}`,
    html: brandedEmail({
      eyebrow: mode === "sandbox" ? "Sandbox fulfillment" : "New order",
      title: "A new order is ready.",
      introduction: "A Coastal Route Coffee order has been paid and is ready for fulfillment.",
      ctaLabel: "Open the storefront",
      content: `
        <div style="border-top:1px solid #e6ddce;border-bottom:1px solid #e6ddce;padding:22px 0;color:#334955;font-size:14px;line-height:1.7;">
          <p style="margin:0 0 8px;"><strong>Order:</strong> ${displayOrderNumber}</p>
          <p style="margin:0 0 8px;"><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>
          <p style="margin:0;"><strong>Delivery:</strong> ${escapeHtml(delivery)}</p>
        </div>
        <h2 style="margin:26px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Items</h2><ul style="padding-left:20px;color:#334955;line-height:1.7;">${itemRows}</ul>
        <h2 style="margin:26px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Ship to</h2><p style="margin:0;color:#334955;line-height:1.7;">${addressHtml(address)}</p>
        <h2 style="margin:26px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Fulfillment</h2><ul style="padding-left:20px;color:#334955;line-height:1.7;">${labelRows}</ul>
        ${mode === "sandbox" ? "<p style=\"color:#a66820;font-size:13px;\">This is a Stripe and Shippo sandbox order. No real postage or payment was created.</p>" : ""}
      `,
    }),
  })];

  if (customerEmail.includes("@")) {
    deliveries.push(sendEmail({
      apiKey,
      from,
      to: customerEmail,
      subject: `${modePrefix}Your Coastal Route Coffee order ${displayOrderNumber} is confirmed`,
      idempotencyKey: `crc-${mode}-customer-${orderId}`,
      html: brandedEmail({
        eyebrow: mode === "sandbox" ? "Sandbox order confirmed" : "Order confirmed",
        title: "Your Coffee Is En Route!",
        introduction: "Thank you for choosing Coastal Route Coffee. We’re grateful to be part of your daily ritual. Your order is confirmed, and we’ll prepare your coffee with care.",
        ctaLabel: "Continue your route",
        content: `
          <p style="margin:0 0 20px;padding:16px 18px;background:#f4eee2;border-radius:12px;color:#334955;"><strong>Order:</strong> ${displayOrderNumber}</p>
          <h2 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Your coffee</h2><ul style="padding-left:20px;color:#334955;line-height:1.7;">${itemRows}</ul>
          <p style="margin:20px 0;padding:16px 18px;background:#f4eee2;border-radius:12px;color:#334955;"><strong>Delivery:</strong> ${escapeHtml(delivery)}</p>
          <h2 style="margin:26px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Deliver to</h2><p style="margin:0;color:#334955;line-height:1.7;">${addressHtml(address)}</p>
          <h2 style="margin:26px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Tracking</h2><ul style="padding-left:20px;color:#334955;line-height:1.7;">${trackingRows}</ul>
          ${includesSubscription ? `<p style="margin:24px 0 0;color:#52636d;font-size:15px;line-height:1.7;">Returning to review your delivery, payment method, or subscription? <a href="${CUSTOMER_PORTAL_URL}" style="color:#a66820;font-weight:700;">Manage your subscription</a>.</p>` : ""}
          ${mode === "sandbox" ? "<p style=\"color:#a66820;font-size:13px;\">This was a sandbox order. No real payment or postage was created.</p>" : ""}
        `,
      }),
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
    html: brandedEmail({
      eyebrow: "Subscription update",
      title: "Your cancellation is confirmed.",
      introduction: "We’re sorry to see you go, and we’re genuinely thankful that you chose Coastal Route Coffee.",
      ctaLabel: "Manage subscription",
      ctaHref: CUSTOMER_PORTAL_URL,
      content: `
        <div style="padding:20px;background:#f4eee2;border-left:4px solid #c49a4a;border-radius:10px;color:#334955;font-size:15px;line-height:1.7;">
          Your monthly coffee subscription is scheduled to end on <strong>${escapeHtml(cancellationDate)}</strong>. Your subscription remains active until then, and you will not be charged again.
        </div>
        <p style="margin:24px 0 0;color:#52636d;font-size:15px;line-height:1.7;">Thank you for letting us roast for you. If there’s anything we could have done better, we’d be grateful to hear from you.</p>
        ${mode === "sandbox" ? "<p style=\"color:#a66820;font-size:13px;\">This was a sandbox subscription. No real payment was processed.</p>" : ""}
      `,
    }),
  });
}

export async function sendSubscriptionEndedEmail({
  eventId,
  customerEmail,
}: {
  eventId: string;
  customerEmail: string;
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
    subject: `${modePrefix}Your Coastal Route Coffee subscription is canceled`,
    idempotencyKey: `crc-${mode}-subscription-ended-${eventId}`,
    html: brandedEmail({
      eyebrow: "Subscription ended",
      title: "Your subscription is canceled.",
      introduction: "We’re sorry to see you go, and we’re genuinely thankful that you chose Coastal Route Coffee.",
      ctaLabel: "Visit the coffee shop",
      content: `
        <div style="padding:20px;background:#f4eee2;border-left:4px solid #c49a4a;border-radius:10px;color:#334955;font-size:15px;line-height:1.7;">
          Your monthly coffee subscription has ended, and you will not be billed again.
        </div>
        <p style="margin:24px 0 0;color:#52636d;font-size:15px;line-height:1.7;">Thank you for letting us be part of your coffee routine. If you decide to return, there will always be a fresh route waiting for you.</p>
        ${mode === "sandbox" ? "<p style=\"color:#a66820;font-size:13px;\">This was a sandbox subscription. No real payment was processed.</p>" : ""}
      `,
    }),
  });
}
