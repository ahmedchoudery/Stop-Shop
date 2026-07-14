import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderShippedCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Shipped" isAdmin={false} />;
}
