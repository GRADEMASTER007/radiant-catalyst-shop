# Living Culture Health — Marketplace Roadmap

## Done

### Rebrand: Purely Health Nutra -> Living Culture Health
- [x] Site name in header, hero and public copy reads Living Culture Health
- [x] New African-marketplace hero on the home page

### Multi-vendor marketplace foundation (2026-09-21)
- [x] Database: products now carry `vendor_id` + `business_id` so a seller owns their listings
- [x] 20-product ceiling enforced in the database from the seller's plan (`features.max_products`)
- [x] Row level security: sellers see/edit only their own products, and only orders containing their products
- [x] Auto-generated SKU and shop link for seller products
- [x] Two seller plans seeded: Starter R150/month, Growth R299/month

## In progress (background build tasks)

- [ ] Seller hub: `/seller` layout, overview, plan & billing (`use-seller.ts`, `SellerLayout`, `seller/Dashboard`, `seller/Subscription`)
- [ ] Seller product manager + read-only orders (`seller/Products`, `ProductFormDialog`, `seller/Orders`)
- [ ] Public selling pages: `/sell` pricing, `/sell/start` sign-up, `/vendor/:slug` storefront (`Sell`, `SellStart`, `VendorStorefront`)
- [ ] Subscription billing backend: `seller-subscription`, `paypal-payment`, `paypal-webhook`, PayFast notification handling for subscriptions

## To do after the build tasks land

- [ ] Wire routes in `src/App.tsx`: `/sell`, `/sell/start`, `/vendor/:slug`, `/seller/*` under `SellerLayout`
- [ ] Add "Sell with us" to the header nav and footer
- [ ] Regenerate database types and fix any type errors
- [ ] Deploy the new edge functions and verify with a real signed-in seller
- [ ] PayPal: add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_WEBHOOK_TOKEN`, then create the live product/plan
- [ ] PayFast: confirm `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` are set on this backend
- [ ] Refresh `sitemap.xml` to include `/sell` and live vendor storefronts; keep `/seller` out of it
- [ ] Two-account manual check: seller A must not see seller B's products or orders

## Blocked / needs the owner

- PayPal credentials are not on this backend yet, so PayPal checkout cannot go live until they are entered
- The remix's stored keys were not carried across: PayFast, AI chat, shipping and CRM settings all need re-entering
- Payout split between platform and seller is not defined yet; orders are not yet split per seller
