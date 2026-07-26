import React from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';
const canonicalUrl = `${siteUrl}/shipping`;

export const metadata = {
  title: 'Nationwide Shipping & Delivery Policy | Stop & Shop Pakistan',
  description: 'Fast nationwide delivery across Pakistan. 1-2 days for Gujrat, Lahore, Islamabad & 2-3 days for Karachi, Peshawar, Quetta.',
  alternates: {
    canonical: canonicalUrl,
    languages: {
      'en-PK': canonicalUrl,
      'ur-PK': `${canonicalUrl}?lang=ur`,
    },
  },
  openGraph: {
    title: 'Nationwide Shipping Policy | Stop & Shop Pakistan',
    description: 'Fast shipping across Gujrat, Lahore, Islamabad, Karachi & all Pakistan cities.',
    url: canonicalUrl,
    siteName: 'Stop & Shop',
    locale: 'en_PK',
    type: 'website',
  },
};

export default function ShippingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How fast is Stop & Shop delivery to Karachi and major cities in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Stop & Shop dispatches all orders from our Gujrat hub within 24 hours. Orders shipped to Lahore, Islamabad, and Rawalpindi arrive in 1 to 2 business days. Orders to Karachi, Peshawar, Quetta, and Multan arrive in 2 to 3 business days via TCS, Leopard, and CallCourier express logistics."
        }
      },
      {
        "@type": "Question",
        "name": "Is Cash on Delivery (COD) available for orders in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Stop & Shop offers nationwide Cash on Delivery (COD) for all cities across Pakistan with zero extra hidden fees. Customers can pay exact order amounts directly to the courier delivery agent upon receiving their parcel."
        }
      },
      {
        "@type": "Question",
        "name": "How can I track my Stop & Shop parcel in real time?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Every dispatched order receives a unique courier tracking number sent via email. You can enter your Order ID on our live tracking page at stop-shop-gamma.vercel.app/track to view real-time delivery checkpoints and courier location updates."
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
            Stop & Shop Pakistan Shipping & Delivery Information
          </h1>
          <p className="text-xs text-gray-700 leading-relaxed mb-4">
            Stop & Shop is Pakistan’s premier luxury apparel brand providing express door-to-door courier shipping to all 100+ cities across Punjab, Sindh, KPK, and Balochistan.
          </p>
          <ul className="space-y-2 text-xs font-bold text-gray-800">
            <li className="flex items-center space-x-2">
              <span className="text-cardinal">✓</span>
              <span><strong>Gujrat, Lahore, Islamabad, Rawalpindi</strong>: Delivered in 1–2 business days.</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-cardinal">✓</span>
              <span><strong>Karachi, Peshawar, Quetta, Multan, Faisalabad</strong>: Delivered in 2–3 business days.</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-cardinal">✓</span>
              <span><strong>Free Shipping & COD</strong>: Cash on Delivery available with free delivery on orders over PKR 5,000.</span>
            </li>
          </ul>
        </div>

        {/* Detailed Shipping Table by City */}
        <div className="mb-10 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
            Delivery Estimates by City (Pakistan)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-200 text-xs">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-3 font-black text-gray-900 uppercase">Region / City</th>
                  <th className="p-3 font-black text-gray-900 uppercase">Estimated Delivery</th>
                  <th className="p-3 font-black text-gray-900 uppercase">Courier Partners</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                <tr>
                  <td className="p-3 font-bold">Gujrat (Flagship Hub)</td>
                  <td className="p-3 text-green-700 font-bold">Same Day / 24 Hours</td>
                  <td className="p-3">Local Rider / Leopard</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Lahore, Islamabad, Rawalpindi, Sialkot</td>
                  <td className="p-3 font-bold">1 – 2 Business Days</td>
                  <td className="p-3">TCS / Leopard / CallCourier</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Karachi, Hyderabad, Sukkur</td>
                  <td className="p-3 font-bold">2 – 3 Business Days</td>
                  <td className="p-3">TCS Express / M&P</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Peshawar, Quetta, Multan, Faisalabad</td>
                  <td className="p-3 font-bold">2 – 3 Business Days</td>
                  <td className="p-3">TCS / Leopard Express</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 border-t border-gray-200 pt-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">
            Frequently Asked Shipping Questions
          </h3>
          <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
            <div className="border border-gray-150 p-4 rounded bg-white">
              <h4 className="font-bold text-gray-900 uppercase mb-2">How fast is delivery to Karachi?</h4>
              <p>
                Stop & Shop dispatches all orders from our Gujrat hub within 24 hours. Orders shipped to Karachi, Hyderabad, and Sindh arrive in 2 to 3 business days via TCS and Leopard express logistics.
              </p>
            </div>
            <div className="border border-gray-150 p-4 rounded bg-white">
              <h4 className="font-bold text-gray-900 uppercase mb-2">Is Cash on Delivery supported?</h4>
              <p>
                Yes, Stop & Shop offers nationwide Cash on Delivery (COD) for all cities across Pakistan with zero extra hidden fees. Customers can pay exact order amounts directly to the courier agent upon parcel arrival.
              </p>
            </div>
            <div className="border border-gray-150 p-4 rounded bg-white">
              <h4 className="font-bold text-gray-900 uppercase mb-2">How do I track my order parcel?</h4>
              <p>
                Every dispatched order receives a unique courier tracking number sent via email. You can enter your Order ID on our live tracking page at stop-shop-gamma.vercel.app/track to view real-time delivery checkpoints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
