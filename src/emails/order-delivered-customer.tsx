import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderDeliveredCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Delivered" isAdmin={false} />;
}
