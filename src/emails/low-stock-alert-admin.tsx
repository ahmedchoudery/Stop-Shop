import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { Section, Text, Link } from '@react-email/components';

export default function LowStockAlertAdminEmail({
  productId = 'PRD-MOCK',
  productName = 'Mock Product Name',
  productImage = '',
  variantId = 'M',
  currentStock = 3,
  salesVelocity = 12,
  threshold = 5,
}: any) {
  const ctaUrl = `https://stop-shop-gamma.vercel.app/admin/inventory?productId=${productId}`;
  const thresholdUrl = `https://stop-shop-gamma.vercel.app/admin/inventory?productId=${productId}`;

  return (
    <BaseLayout
      previewText={`⚠️ LOW STOCK ALERT: ${productName} (${variantId}) has only ${currentStock} units remaining.`}
      title="⚠️ Low Stock Alert"
    >
      <Section style={variantCard}>
        {productImage && (
          <img
            src={productImage}
            alt={productName}
            style={productImg}
            width="100"
            height="125"
          />
        )}
        <div style={variantInfo}>
          <Text style={productNameText}>{productName}</Text>
          <Text style={skuText}>SKU: <strong>{productId}</strong></Text>
          <Text style={skuText}>Variant: <strong>{variantId}</strong></Text>
          <Text style={stockBadge(currentStock)}>
            Stock Left: <strong>{currentStock}</strong> / {threshold}
          </Text>
        </div>
      </Section>

      <Section style={statsSection}>
        <Text style={statsHeading}>LAST 7 DAYS SALES VELOCITY</Text>
        <Text style={statsValue}>{salesVelocity} unit(s) sold</Text>
      </Section>

      <Section style={actionContainer}>
        <Link href={ctaUrl} style={btnPrimary}>
          REORDER PRODUCT
        </Link>
        <Link href={thresholdUrl} style={btnSecondary}>
          Adjust Threshold
        </Link>
      </Section>
    </BaseLayout>
  );
}

const variantCard = {
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

const variantInfo = {
  overflow: 'hidden' as const,
};

const productNameText = {
  fontSize: '16px',
  fontWeight: '800',
  color: '#111827',
  margin: '0 0 8px',
};

const skuText = {
  fontSize: '13px',
  color: '#4b5563',
  margin: '0 0 4px',
};

const stockBadge = (stock: number) => ({
  display: 'inline-block',
  marginTop: '8px',
  padding: '4px 8px',
  fontSize: '12px',
  fontWeight: 'bold' as const,
  color: stock === 0 ? '#b91c1c' : '#b45309',
  backgroundColor: stock === 0 ? '#fee2e2' : '#fef3c7',
  borderRadius: '4px',
});

const statsSection = {
  padding: '16px 20px',
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  clear: 'both' as const,
};

const statsHeading = {
  margin: '0 0 4px',
  fontSize: '11px',
  fontWeight: '900',
  letterSpacing: '1px',
  color: '#6b7280',
};

const statsValue = {
  margin: '0',
  fontSize: '20px',
  fontWeight: '900',
  color: '#111827',
};

const actionContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const btnPrimary = {
  display: 'inline-block',
  backgroundColor: '#ba1f3d',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textDecoration: 'none',
  marginRight: '12px',
  textTransform: 'uppercase' as const,
};

const btnSecondary = {
  display: 'inline-block',
  backgroundColor: '#ffffff',
  color: '#111827',
  padding: '12px 24px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
};
