import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { Text, Link, Hr, Section } from '@react-email/components';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface Order {
  _id?: string;
  orderID: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    zip?: string;
  };
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
}

interface OrderLifecycleEmailProps {
  order: Order;
  status: 'Confirmed' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Failed' | 'Refunded';
  isAdmin: boolean;
  customerPastOrderCount?: number;
}

export const OrderLifecycleEmail: React.FC<OrderLifecycleEmailProps> = ({
  order,
  status,
  isAdmin,
  customerPastOrderCount = 0,
}) => {
  const { orderID, customer, items, total, paymentMethod } = order;

  // Next steps mapping
  const nextSteps = {
    Confirmed: 'We are preparing your package for shipment.',
    Paid: 'Payment verified. Processing packaging details.',
    Shipped: `Dispatched via ${order.courier || 'TCS'}. Tracking #: ${order.trackingNumber || 'N/A'}.`,
    Delivered: 'Delivered. Thank you for shopping with us!',
    Cancelled: 'This order has been cancelled.',
    Failed: 'Fulfillment or payment has failed. Please verify with customer care.',
    Refunded: 'Refund successfully initiated to original payment source.',
  };

  const previewText = `${isAdmin ? '[ADMIN] ' : ''}Order #${orderID} - ${status} Notification`;
  const nextStepText = nextSteps[status] || '';

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.max(0, subtotal - total);

  // App URL helper
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stop-shop-gamma.vercel.app';
  const trackUrl = `${appUrl}/track?orderID=${orderID}&email=${encodeURIComponent(customer.email)}`;
  const adminOrderUrl = `${appUrl}/admin/orders/${order._id || orderID}`;

  return (
    <BaseLayout previewText={previewText} title={`${status} Order Details`}>
      <Text style={text}>
        Hi {isAdmin ? 'Admin' : <strong>{customer.name}</strong>},
      </Text>
      
      <Text style={text}>
        {isAdmin
          ? `Order #${orderID} has transitioned to ${status.toUpperCase()} state.`
          : `We want to update you that your order #${orderID} is now ${status.toLowerCase()}.`
        }
      </Text>

      {/* Next Step Box */}
      <Section style={nextStepBox}>
        <Text style={boxLabel}>Status: {status.toUpperCase()}</Text>
        <Text style={boxValue}>{nextStepText}</Text>
      </Section>

      {/* Itemized Lines */}
      <Text style={sectionTitle}>Items Ordered</Text>
      <Section style={itemsContainer}>
        {items.map((item, idx) => {
          const itemSubtotal = item.price * item.quantity;
          const details = [];
          if (item.selectedSize) details.push(`Size: ${item.selectedSize}`);
          if (item.selectedColor) {
            const colorName = item.selectedColor.split('|').pop()?.trim() || item.selectedColor;
            details.push(`Color: ${colorName}`);
          }

          return (
            <div key={idx} style={itemRow}>
              <div style={itemDetailsCol}>
                <Text style={itemName}>{item.name}</Text>
                {details.length > 0 && <Text style={itemSubtext}>{details.join(' · ')}</Text>}
                <Text style={itemQty}>Qty: {item.quantity} @ Rs. {item.price.toLocaleString('en-PK')}</Text>
              </div>
              <div style={itemPriceCol}>
                <Text style={itemPrice}>Rs. {itemSubtotal.toLocaleString('en-PK')}</Text>
              </div>
            </div>
          );
        })}
      </Section>

      <Hr style={divider} />

      {/* Totals Section */}
      <Section style={totalsSection}>
        <div style={totalRow}>
          <Text style={totalLabel}>Subtotal</Text>
          <Text style={totalVal}>Rs. {subtotal.toLocaleString('en-PK')}</Text>
        </div>
        <div style={totalRow}>
          <Text style={totalLabel}>Shipping</Text>
          <Text style={totalValGreen}>FREE</Text>
        </div>
        {discountAmount > 0 && (
          <div style={totalRow}>
            <Text style={totalLabelRed}>Discount</Text>
            <Text style={totalValRed}>- Rs. {discountAmount.toLocaleString('en-PK')}</Text>
          </div>
        )}
        <Hr style={dividerSmall} />
        <div style={totalRow}>
          <Text style={grandTotalLabel}>Grand Total</Text>
          <Text style={grandTotalVal}>Rs. {total.toLocaleString('en-PK')}</Text>
        </div>
      </Section>

      {/* Delivery Address */}
      <Text style={sectionTitle}>Shipping Information</Text>
      <Section style={addressBox}>
        <Text style={addressText}><strong>{customer.name}</strong></Text>
        <Text style={addressText}>{customer.address}</Text>
        <Text style={addressText}>{customer.city} {customer.zip ? ` - ${customer.zip}` : ''}</Text>
        {customer.phone && <Text style={addressPhone}>Phone: {customer.phone}</Text>}
        <Text style={paymentText}>Payment Method: {paymentMethod}</Text>
      </Section>

      {!isAdmin && (
        <Section style={actionContainer}>
          <Link href={trackUrl} style={button}>
            Track Your Order &rarr;
          </Link>
        </Section>
      )}

      {/* Admin Specific Fields */}
      {isAdmin && (
        <>
          <Text style={sectionTitle}>Admin Metadata</Text>
          <Section style={adminBox}>
            <Text style={adminText}>
              <strong>Deep Link:</strong> <Link href={adminOrderUrl} style={adminLink}>{adminOrderUrl}</Link>
            </Text>
            <Text style={adminText}>
              <strong>Customer Past Orders:</strong> {customerPastOrderCount} order(s)
            </Text>
            {order.notes && (
              <Text style={adminText}>
                <strong>Internal Notes:</strong> {order.notes}
              </Text>
            )}
          </Section>
        </>
      )}
    </BaseLayout>
  );
};

const text = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#404040',
  margin: '0 0 16px',
};

const nextStepBox = {
  backgroundColor: '#fcfcfc',
  border: '1px solid #e5e7eb',
  padding: '16px',
  marginBottom: '24px',
  borderRadius: '2px',
};

const boxLabel = {
  margin: '0 0 4px',
  fontSize: '9px',
  fontWeight: '900',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#ba1f3d',
};

const boxValue = {
  margin: '0',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#0d0d0d',
};

const sectionTitle = {
  fontSize: '11px',
  fontWeight: '900',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#737373',
  margin: '24px 0 12px',
};

const itemsContainer = {
  backgroundColor: '#fcfcfc',
  border: '1px solid #e5e7eb',
  borderRadius: '2px',
  padding: '8px 16px',
  marginBottom: '16px',
};

const itemRow = {
  display: 'flex',
  flexDirection: 'row' as const,
  borderBottom: '1px solid #f3f4f6',
  padding: '12px 0',
};

const itemDetailsCol = {
  flex: '1',
};

const itemName = {
  margin: '0',
  fontSize: '12px',
  fontWeight: '900',
  textTransform: 'uppercase' as const,
  color: '#171717',
};

const itemSubtext = {
  margin: '2px 0 0',
  fontSize: '9px',
  color: '#737373',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
};

const itemQty = {
  margin: '4px 0 0',
  fontSize: '10px',
  color: '#737373',
  fontWeight: '500',
};

const itemPriceCol = {
  textAlign: 'right' as const,
  verticalAlign: 'top',
  paddingLeft: '12px',
};

const itemPrice = {
  margin: '0',
  fontSize: '12px',
  fontWeight: '900',
  color: '#171717',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const dividerSmall = {
  borderColor: '#e5e7eb',
  margin: '8px 0',
};

const totalsSection = {
  marginBottom: '24px',
};

const totalRow = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'space-between',
  padding: '4px 0',
};

const totalLabel = {
  margin: '0',
  fontSize: '11px',
  color: '#737373',
};

const totalVal = {
  margin: '0',
  fontSize: '11px',
  color: '#171717',
  fontWeight: '700',
};

const totalValGreen = {
  margin: '0',
  fontSize: '11px',
  color: '#16a34a',
  fontWeight: 'bold',
};

const totalLabelRed = {
  margin: '0',
  fontSize: '11px',
  color: '#ba1f3d',
  fontWeight: 'bold',
};

const totalValRed = {
  margin: '0',
  fontSize: '11px',
  color: '#ba1f3d',
  fontWeight: 'bold',
};

const grandTotalLabel = {
  margin: '0',
  fontSize: '13px',
  fontWeight: '900',
  color: '#0d0d0d',
  textTransform: 'uppercase' as const,
};

const grandTotalVal = {
  margin: '0',
  fontSize: '18px',
  fontWeight: '900',
  color: '#ba1f3d',
};

const addressBox = {
  backgroundColor: '#fcfcfc',
  border: '1px solid #e5e7eb',
  padding: '16px',
  borderRadius: '2px',
  marginBottom: '24px',
};

const addressText = {
  margin: '0 0 2px',
  fontSize: '12px',
  color: '#171717',
  lineHeight: '1.4',
};

const addressPhone = {
  margin: '8px 0 0',
  fontSize: '11px',
  color: '#737373',
};

const paymentText = {
  margin: '8px 0 0',
  fontSize: '10px',
  color: '#737373',
};

const actionContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#ba1f3d',
  color: '#ffffff',
  padding: '14px 32px',
  fontSize: '10px',
  fontWeight: '900',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  borderRadius: '2px',
  display: 'inline-block',
};

const adminBox = {
  backgroundColor: '#fee2e2',
  border: '1px solid #fca5a5',
  padding: '16px',
  borderRadius: '2px',
};

const adminText = {
  margin: '0 0 6px',
  fontSize: '11px',
  color: '#7f1d1d',
  lineHeight: '1.5',
};

const adminLink = {
  color: '#b91c1c',
  fontWeight: 'bold',
  textDecoration: 'underline',
};
