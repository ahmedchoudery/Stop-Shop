import React from 'react';
import ReturnsPage from '../../views/ReturnsPage.jsx';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';
const canonicalUrl = `${siteUrl}/returns`;

export const metadata = {
  title: 'Returns & Exchange Policy | Stop & Shop Pakistan',
  description: 'Hassle-free 7-day return and exchange policy at Stop & Shop. Easy cash refunds and size exchanges across Pakistan.',
  alternates: {
    canonical: canonicalUrl,
    languages: {
      'en-PK': canonicalUrl,
      'ur-PK': `${canonicalUrl}?lang=ur`,
    },
  },
  openGraph: {
    title: 'Returns & Exchange Policy | Stop & Shop Pakistan',
    description: 'Hassle-free 7-day return and exchange policy at Stop & Shop.',
    url: canonicalUrl,
    siteName: 'Stop & Shop',
    locale: 'en_PK',
    type: 'website',
  },
};

export default function Page() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the Stop & Shop return policy in Pakistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer a 7-day hassle-free return and exchange policy for all unused items with original tags intact."
        }
      },
      {
        "@type": "Question",
        "name": "How long does an exchange take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Once your return item is received and inspected at our Gujrat hub, your exchange item is dispatched within 24-48 hours via express courier."
        }
      },
      {
        "@type": "Question",
        "name": "Are return shipping fees covered?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "If you received a damaged or wrong item, Stop & Shop covers 100% of return shipping costs."
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
      <ReturnsPage />
    </>
  );
}
