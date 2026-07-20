import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { Section, Text, Link } from '@react-email/components';

export default function RestockNotificationCustomerEmail({
  customerName = 'Valued Customer',
  productName = 'Product Name',
  productImage = '',
  selectedSize = '',
  selectedColor = '',
  productPrice = 'Rs. 0',
  ctaUrl = 'https://stop-shop-gamma.vercel.app',
}: any) {
  const previewText = `🔥 BACK IN STOCK: The ${productName} you wanted is now restocked!`;

  return (
    <BaseLayout previewText={previewText} title="🔥 Back in Stock">
      <Text style={greetingText}>
        Hi <strong>{customerName}</strong>,
      </Text>

      <Text style={introText}>
        Good news! The item you were looking for is back in stock. We saved your spot on the waitlist, and now you can grab it before it sells out again.
      </Text>

      <Section style={productCard}>
        {productImage && (
          <img
            src={productImage}
            alt={productName}
            style={productImg}
            width="120"
            height="160"
          />
        )}
        <div style={productInfo}>
          <Text style={nameText}>{productName}</Text>
          <Text style={priceText}>{productPrice}</Text>
          {(selectedSize || selectedColor) && (
            <div style={detailsContainer}>
              {selectedSize && (
                <Text style={detailText}>
                  Size: <strong>{selectedSize}</strong>
                </Text>
              )}
              {selectedColor && (
                <Text style={detailText}>
                  Color: <strong>{selectedColor.split('|').pop()?.trim() || selectedColor}</strong>
                </Text>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section style={actionContainer}>
        <Link href={ctaUrl} style={btnPrimary}>
          Shop Now &rarr;
        </Link>
      </Section>

      <Text style={urgencyText}>
        Please note: stock is highly limited for this restock batch. Act fast to secure yours!
      </Text>
    </BaseLayout>
  );
}

const greetingText = {
  fontSize: '14px',
  color: '#111827',
  margin: '0 0 12px',
  lineHeight: '1.5',
};

const introText = {
  fontSize: '13px',
  color: '#4b5563',
  margin: '0 0 24px',
  lineHeight: '1.6',
};

const productCard = {
  padding: '20px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  marginBottom: '24px',
};

const productImg = {
  objectFit: 'cover' as const,
  borderRadius: '4px',
  float: 'left' as const,
  marginRight: '20px',
};

const productInfo = {
  overflow: 'hidden' as const,
};

const nameText = {
  fontSize: '15px',
  fontWeight: '900',
  color: '#111827',
  textTransform: 'uppercase' as const,
  letterSpacing: '-0.3px',
  margin: '0 0 6px',
};

const priceText = {
  fontSize: '14px',
  fontWeight: '800',
  color: '#ba1f3d',
  margin: '0 0 12px',
};

const detailsContainer = {
  marginTop: '8px',
  borderTop: '1px dashed #e5e7eb',
  paddingTop: '8px',
};

const detailText = {
  fontSize: '11px',
  color: '#6b7280',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const actionContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 24px',
};

const btnPrimary = {
  display: 'inline-block',
  backgroundColor: '#0d0d0d',
  color: '#ffffff',
  padding: '16px 32px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '900',
  letterSpacing: '3px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  transition: 'background-color 0.2s ease',
};

const urgencyText = {
  fontSize: '10px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  fontStyle: 'italic',
  margin: '16px 0 0',
  lineHeight: '1.4',
};
