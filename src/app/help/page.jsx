import React from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';
const canonicalUrl = `${siteUrl}/help`;

export const metadata = {
  title: 'Customer Help & Support Center | Stop & Shop Pakistan',
  description: 'Need assistance with your clothing order? Contact Stop & Shop customer support in Gujrat, Pakistan. FAQ, returns, shipping, and order assistance.',
  alternates: {
    canonical: canonicalUrl,
    languages: {
      'en-PK': canonicalUrl,
      'ur-PK': `${canonicalUrl}?lang=ur`,
    },
  },
  openGraph: {
    title: 'Customer Support Center | Stop & Shop Pakistan',
    description: 'Stop & Shop customer assistance for orders, returns, payments, and size guidance in Pakistan.',
    url: canonicalUrl,
    siteName: 'Stop & Shop',
    locale: 'en_PK',
    type: 'website',
  },
};

export default function HelpPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I contact Stop & Shop customer support in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Stop & Shop customer support is available Monday through Saturday from 10:00 AM to 10:00 PM PKT. You can reach our team via phone or WhatsApp at +92 306 8458655 or by emailing ahmedchoudery30@gmail.com for instant order help."
        }
      },
      {
        "@type": "Question",
        "name": "Where is the Stop & Shop physical store located in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our flagship retail store and distribution hub is located at Main Bazaar, Gujrat, Punjab 50700, Pakistan. Visitors can try on luxury garments, inspect fabrics, and process direct size exchanges in person."
        }
      },
      {
        "@type": "Question",
        "name": "What payment methods are accepted at Stop & Shop?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Stop & Shop accepts Cash on Delivery (COD) for all cities across Pakistan, as well as online credit/debit card payments, bank transfers, and verified mobile wallet checkouts."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-6 sm:px-10 pt-[120px] pb-16">
        {/* AI-lift summary box */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 mb-8">
          <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-3">
            Stop & Shop Customer Help & Support Center
          </h1>
          <p className="text-xs text-gray-700 leading-relaxed mb-4">
            Stop & Shop is a premier luxury fashion e-commerce store operating out of Gujrat, Punjab, providing dedicated customer service across Pakistan for orders, returns, size fittings, and parcel tracking.
          </p>
          <ul className="space-y-2 text-xs font-bold text-gray-800">
            <li className="flex items-center space-x-2">
              <span className="text-cardinal">✓</span>
              <span><strong>Store Address</strong>: Main Bazaar, Gujrat, Punjab 50700, Pakistan.</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-cardinal">✓</span>
              <span><strong>Phone / WhatsApp Support</strong>: +92 306 8458655 (Mon–Sat 10 AM – 10 PM).</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-cardinal">✓</span>
              <span><strong>Support Email</strong>: ahmedchoudery30@gmail.com</span>
            </li>
          </ul>
        </div>

        {/* Support Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <a href="/track" className="p-5 border border-gray-200 rounded-md hover:border-black transition-all bg-white block">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-2">Track Order</h3>
            <p className="text-[11px] text-gray-500 font-medium">Check real-time courier shipping status for your order ID.</p>
          </a>
          <a href="/returns" className="p-5 border border-gray-200 rounded-md hover:border-black transition-all bg-white block">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-2">Returns & Exchanges</h3>
            <p className="text-[11px] text-gray-500 font-medium">Submit a 7-day return or request a size exchange.</p>
          </a>
          <a href="/shipping" className="p-5 border border-gray-200 rounded-md hover:border-black transition-all bg-white block">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-2">Shipping Rates</h3>
            <p className="text-[11px] text-gray-500 font-medium">View delivery timetables and courier options by city.</p>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 border-t border-gray-200 pt-8">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">
            Frequently Asked Support Questions
          </h2>
          <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
            <div className="border border-gray-150 p-4 rounded bg-white">
              <h3 className="font-bold text-gray-900 uppercase mb-2">How do I contact customer support?</h3>
              <p>
                Stop & Shop customer support is available Monday through Saturday from 10:00 AM to 10:00 PM PKT. You can reach our team via phone or WhatsApp at +92 306 8458655 or by emailing ahmedchoudery30@gmail.com for instant order help.
              </p>
            </div>
            <div className="border border-gray-150 p-4 rounded bg-white">
              <h3 className="font-bold text-gray-900 uppercase mb-2">Where is the Stop & Shop physical store?</h3>
              <p>
                Our flagship retail store and distribution hub is located at Main Bazaar, Gujrat, Punjab 50700, Pakistan. Visitors can try on luxury garments, inspect fabrics, and process direct size exchanges in person.
              </p>
            </div>
            <div className="border border-gray-150 p-4 rounded bg-white">
              <h3 className="font-bold text-gray-900 uppercase mb-2">What payment methods are supported?</h3>
              <p>
                Stop & Shop accepts Cash on Delivery (COD) for all cities across Pakistan, as well as online credit/debit card payments, bank transfers, and verified mobile wallet checkouts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
