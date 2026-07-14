import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderPaymentFailedCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Failed" isAdmin={false} />;
}
