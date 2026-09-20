# Living Culture Health — Rebrand & Marketplace Roadmap

## In scope (from user request 2026-09-20)

### 1. Rebrand: Purely Health Nutra → Living Culture Health
- [ ] Site name everywhere: index.html, manifest.json, Header/footer, About, Contact, SEOHead defaults
- [ ] All public-facing copy that says "Purely Health Nutra" or "Gut Health Probiotics South Africa"
- [ ] og:* / twitter:* meta tags
- [ ] JSON-LD Organization/LocalBusiness schema
- [ ] Footer branding + copyright
- [ ] Contact page name references

### 2. Hero replacement
- [ ] Remove/replace current hero (video hero currently on home)
- [ ] Generate new African-vibe, high-energy living-culture hero video (videogen)
- [ ] Message: "Multi-vendor marketplace — sell your products on an international platform — R150/month"

### 3. Multi-vendor marketplace SaaS
- [ ] Seller onboarding (sign up as vendor)
- [ ] Seller dashboard (their products, orders, earnings)
- [ ] Product listing UI for sellers, cap at 20 products per seller
- [ ] R150/month subscription billing for sellers (PayFast or PayPal)
- [ ] Vendor storefronts (`/vendor/:slug`)

### 4. Payments
- [ ] PayFast gateway integration (existing `payfast-payment` + `payfast-itn` functions present — verify wiring)
- [ ] PayPal gateway integration (new — needs PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET)

### 5. SEO & fingerprints
- [ ] New title/description across pages
- [ ] Update sitemap.xml, robots.txt, manifest.json
- [ ] JSON-LD rebrand
- [ ] New favicon / brand icon

## Status
In progress — starting with roadmap, then rebrand pass, then hero video, then marketplace scaffolding.
