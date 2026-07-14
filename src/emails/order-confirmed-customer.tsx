import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderConfirmedCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Confirmed" isAdmin={false} />;
}
