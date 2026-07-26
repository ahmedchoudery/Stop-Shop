# Technical & Local SEO Documentation — Stop & Shop Pakistan

This document outlines the technical search engine optimization (SEO) architecture, local search Strategy for Pakistan, Google Business Profile postcard verification workflow, and Rich Results validation standards for Stop & Shop.

---

## 1. Google Business Profile (GBP) Verification Checklist

To rank #1 for local brand queries in Gujrat, Punjab, and rank across Pakistan, follow this physical store postcard verification checklist:

### Step 1: Profile Initialization
1. Sign in to [Google Business Profile Manager](https://business.google.com/).
2. Register the exact business name: `Stop & Shop`.
3. Select primary category: `Clothing store` or `Men's clothing store`.
4. Select secondary categories: `Fashion accessories store`, `Shoe store`, `Youth clothing store`.

### Step 2: Physical Location & Address Standardization
- **Street Address**: Main Bazaar
- **City**: Gujrat
- **State / Province**: Punjab
- **Postal Code**: 50700
- **Country**: Pakistan (PK)
- **Geographic Coordinates**: Latitude `32.5742`, Longitude `74.0754`
- **Phone Number**: `+92 306 8458655`
- **Website URL**: `https://stop-shop-gamma.vercel.app`

### Step 3: Postcard Verification Request
1. Request postcard verification via postal mail to the Gujrat Main Bazaar store location.
2. Maintain exact address formatting with the local Gujrat General Post Office (GPO).
3. Upon receiving the 5-digit verification PIN, enter it into Google Business Profile Manager immediately.

### Step 4: Profile Optimization & Local Citations
- Add high-resolution store photos (exterior facade, interior showroom, apparel racks).
- Set opening hours: `Monday – Saturday: 10:00 AM – 10:00 PM`.
- Publish regular Google Posts highlighting new collection drops and seasonal promotions.
- Maintain NAP (Name, Address, Phone) consistency across local directories (YellowPages PK, PakBiz, Facebook Local, Instagram Location Tag).

---

## 2. Technical SEO Architecture & Meta Standards

### Per-Route Metadata Matrix
- **Homepage (`/`)**:
  - `Title`: `Stop & Shop — Premium Clothing & Luxury Apparel Pakistan` (< 60 chars)
  - `Description`: `Shop luxury clothing, premium shirts, trousers, footwear, and accessories at Stop & Shop. Express shipping across Gujrat & Pakistan.` (< 160 chars)
  - `Canonical`: `https://stop-shop-gamma.vercel.app/`
  - `hreflang`: `en-PK` (default), `ur-PK` (`/?lang=ur`)

- **Category Pages (`/category/[slug]`)**:
  - `Title`: `Luxury [Category] & Apparel | Stop & Shop Pakistan`
  - `Canonical`: `https://stop-shop-gamma.vercel.app/category/[slug]`
  - `Subcategories`: Internal linking pills to sub-tier products (`Shirts`, `Polos`, `Trousers`, `Accessories`)

- **Product Pages (`/product/[id]`)**:
  - `Title`: `[Product Name] — Luxury [Category] | Stop & Shop`
  - `Canonical`: `https://stop-shop-gamma.vercel.app/product/[id]`

---

## 3. Structured Data (JSON-LD) Implementations

Stop & Shop implements Google-compliant JSON-LD structured data schemas across all pages:

1. **Sitewide (`layout.jsx`)**:
   - `Organization`: Name, URL, Logo, Social Profiles (`sameAs`).
   - `WebSite`: URL, Name, `SearchAction` deep linking (`/search?q={search_term_string}`).
   - `LocalBusiness` / `ClothingStore`: NAP, GeoCoordinates, OpeningHoursSpecification, PriceRange (`PKR 1,500 - 25,000`).

2. **Category Pages (`/category/[slug]/page.jsx`)**:
   - `CollectionPage`: ItemList containing positions and URLs.
   - `BreadcrumbList`: `Home -> Category Name`.

3. **Product Detail Pages (`/product/[id]/page.jsx`)**:
   - `Product`: Name, Image, Description, SKU, MPN, Brand.
   - `Offer`: Price (`PKR`), Availability (`InStock` / `OutOfStock`), ItemCondition (`NewCondition`).
   - `AggregateRating`: Rating value & review counts.
   - `BreadcrumbList`: `Home -> Category -> Product Name`.

4. **Returns & Help (`/returns/page.jsx`)**:
   - `FAQPage`: Question & Answer entities for return window, shipping, and exchange rules.

---

## 4. Search Engine Crawling & Verification

### Dynamic Sitemap
- Endpoint: `https://stop-shop-gamma.vercel.app/sitemap.xml`
- Includes static pages, category pages, and dynamic product pages with `<image:image>` extensions.

### Robots.txt Configuration
- Endpoint: `https://stop-shop-gamma.vercel.app/robots.txt`
- Directs search crawlers to `sitemap.xml` and blocks administrative endpoints (`/admin`, `/api/`, `/checkout`, `/account`).

### Search Console & Bing Webmaster Verification
- Verification meta tags configured via environment variables `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
- Submit `sitemap.xml` directly in Google Search Console & Bing Webmaster Tools post-deployment.
