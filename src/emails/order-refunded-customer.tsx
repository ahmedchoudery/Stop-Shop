import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderRefundedCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Refunded" isAdmin={false} />;
}
