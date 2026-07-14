import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderCancelledCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Cancelled" isAdmin={false} />;
}
