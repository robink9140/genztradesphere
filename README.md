# GenZTradeSphere — B2B Fashion Wholesale MVP

A responsive single-vendor B2B fashion wholesale storefront built with Next.js, TypeScript, Tailwind CSS, Supabase and Razorpay.

## Included
- Responsive storefront, category filters and product search
- Wholesale product cards with MOQ, pricing, stock, sizes and colors
- Cart persisted in the browser
- Checkout details form
- Razorpay order creation on the server and payment-signature verification
- Supabase schema for products, customer profiles and orders
- Supabase email/password sign-up and sign-in
- Admin-only order dashboard (requires an admin profile)
- Demo product catalog when Supabase is not configured

## Run locally

1. Install Node.js 20.9+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev` and open http://localhost:3000.

The storefront can be previewed with demo products before connecting services. Authentication, persistent catalog/orders and payments need the configuration below.

## Supabase setup

1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy the Project URL and anon key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY`. **Never expose this key in browser code or commit it.**
5. Enable Email provider under Authentication settings. Configure your production Site URL and redirect URLs before launch.
6. Create a customer account at `/login`.
7. Promote your own account to admin by running the final commented SQL statement in `schema.sql`, replacing the email address.

The service-role key bypasses RLS and is used only in server API routes. Keep it secret.

## Razorpay setup

1. Create/verify a Razorpay merchant account at https://razorpay.com.
2. Start with Razorpay **test mode** API keys.
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env.local`. The public key ID is safe to expose; the secret is server-only.
4. Restart the dev server. Test checkout using Razorpay's test payment methods.
5. Before accepting real money, complete Razorpay account activation/KYC, switch to live keys, configure webhooks, test refunds and failed payments, and publish clear shipping, returns, privacy and terms policies.

The API recomputes order totals on the server from the active catalog and MOQ rather than trusting the browser's cart total. Payment signatures are verified server-side before recording the order.

## Deploy

1. Push the project to a private GitHub repository.
2. Import it into Vercel.
3. Add the environment variables from `.env.local` in Vercel Project Settings (never commit `.env.local`).
4. Set the production domain in Supabase Auth URL configuration.
5. Add the production domain and Razorpay live keys only after end-to-end testing.

## Important before real launch

- Demo products, images, prices, stock and contact details are placeholders. Replace them with your actual inventory and licensed product photography.
- Verify supplier authorization, garment specifications, GST treatment, HSN codes, invoices, shipping rates, delivery promises and return/refund terms with qualified professionals.
- The MVP currently records a paid order after the browser returns a valid Razorpay signature. For production, add Razorpay webhooks and idempotent payment/order state handling, inventory reservation/decrement, email notifications, shipping integration, cancellation/refund workflows, GST-compliant invoicing, audit logs and abuse/rate-limit controls.
- Product management is currently prepared through Supabase and the admin dashboard shows orders. A full visual product editor and order-status controls are the next build phase.
- Customer accounts are available, but guest checkout is currently supported by the storefront. Order history linked to the signed-in account is a follow-up feature.
- Do not treat the demo catalog or the current MVP as production-ready until the launch checklist and security review are complete.

## Useful commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm start` — serve production build

## Razorpay website-review pages

The following public pages have been added to the MVP and are linked from the footer:
- `/about`
- `/contact`
- `/pricing`
- `/terms`
- `/privacy-policy`
- `/shipping-policy`
- `/refund-policy`

Before submitting the live URL to Razorpay, the owner must complete the exact registered company name, CIN, PAN and GSTIN (if applicable), verify the full postal address against company documents, confirm shipping charges and actual delivery estimates, and publish an operational refund-initiation timeframe. The owner supplied the address 2A, 1st Floor, Sante Mazara, Mohali, Punjab – 140307, India; verify the spelling and whether this is the registered or operating address before Razorpay review. The policy pages now state the 2–5 business day dispatch estimate and accept returns only for defective, damaged-in-transit or incorrectly supplied items, without waiving statutory rights. Replace demo product images/prices/stock with real catalogue information, publish the site on a valid domain, and confirm checkout/payment flows before applying for live-mode access. See `RAZORPAY-SUBMISSION-CHECKLIST.md` for remaining requirements.

## Owner-supplied business details (policy draft)
- Trade name: GenZTradeSphere
- Business structure stated by owner: Private Limited Company (verify that the entity is incorporated and use its exact registered legal name in merchant/KYC records)
- Address supplied: 2A, 1st Floor, Sante Mazara, Mohali, Punjab – 140307, India
- Support: supportgenztradesphere@gmail.com · +91 9140244915
- Dispatch estimate: 2–5 business days after payment and stock confirmation
- Returns: only defective, damaged-in-transit or incorrectly supplied items, subject to applicable law

The exact incorporated company name, CIN, company PAN, GSTIN (if applicable), verified registered-office status and operational refund-initiation timeframe remain outstanding. Do not represent the site as fully Razorpay-ready until these are confirmed, the live domain is deployed, real products/prices are added, and end-to-end payment testing and production security work are complete. See `RAZORPAY-SUBMISSION-CHECKLIST.md`.
