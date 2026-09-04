import { randomUUID } from "node:crypto";
import { enforceRateLimit, enforceSameOrigin, readLimitedJson, requestErrorResponse } from "@/lib/http-security";
import { sendContactEmails } from "@/lib/notifications";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textField(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function singleLineField(value: unknown, maxLength: number) {
  return textField(value, maxLength).replace(/[\r\n]+/g, " ");
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, "contact", 5, 600);
    const body = await readLimitedJson(request, 8_192);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Please complete the contact form." }, { status: 400 });
    }

    const fields = body as Record<string, unknown>;
    const name = singleLineField(fields.name, 80);
    const email = singleLineField(fields.email, 254).toLowerCase();
    const orderNumber = singleLineField(fields.orderNumber, 80);
    const subject = singleLineField(fields.subject, 120);
    const message = textField(fields.message, 3_000);
    const website = textField(fields.website, 200);

    // Bots commonly fill fields hidden from people. Return success without sending.
    if (website) return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

    if (name.length < 2 || !emailPattern.test(email) || subject.length < 3 || message.length < 10) {
      return Response.json(
        { error: "Please enter your name, a valid email, a subject, and a little more detail in your message." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    await sendContactEmails({
      inquiryId: randomUUID(),
      name,
      email,
      orderNumber: orderNumber || undefined,
      subject,
      message,
    });

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Contact form submission failed", { error: error instanceof Error ? error.name : "unknown" });
    return requestErrorResponse(error, "We couldn’t send your message just now. Please email coastalroutecoffee@gmail.com directly.");
  }
}
