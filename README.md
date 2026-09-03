# Coastal Route Coffee

This is the new Coastal Route Coffee website, built with [Next.js](https://nextjs.org), the App Router, TypeScript, ESLint, and Tailwind CSS.

## Getting Started

Copy `.env.example` to `.env.local` and provide the Stripe sandbox variables. USPS and UPS carrier rates additionally use:

- `COMMERCE_MODE` — `sandbox` by default; use `live` only after the dedicated live credentials below are ready

- `SHIPPO_API_TOKEN` — a Shippo Test key while the storefront remains in sandbox mode
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — Stripe sandbox credentials
- `SHIPPO_LIVE_API_TOKEN` — Shippo Live key, used only when `COMMERCE_MODE=live`
- `STRIPE_LIVE_SECRET_KEY` and `STRIPE_LIVE_WEBHOOK_SECRET` — Stripe live credentials, used only when `COMMERCE_MODE=live`

All secret credentials are read only by server routes and must never use a `NEXT_PUBLIC_` prefix. Sandbox and live credentials remain separate, and the storefront rejects any Shippo or Stripe credential that does not match `COMMERCE_MODE`.

Sandbox fulfillment additionally uses:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — durable duplicate-event protection for Stripe webhooks
- `RESEND_API_KEY` — optional merchant fulfillment email delivery
- `FULFILLMENT_EMAIL_TO` — merchant notification recipient (defaults to `coastalroutecoffee@gmail.com`)
- `FULFILLMENT_FROM_EMAIL` — verified Resend sender (uses Resend's sandbox sender during testing)

Only checkout sessions created with the current fulfillment mode and version are processed. Sandbox mode rejects live Stripe events and Shippo keys; live mode rejects test credentials. Carrier orders create 4×6 Shippo labels; local-delivery orders create no carrier label. Monthly subscription renewals use the current shipping address stored on the Stripe customer. Each successful fulfillment sends a customer confirmation with tracking information and a separate merchant email containing the downloadable label.

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
