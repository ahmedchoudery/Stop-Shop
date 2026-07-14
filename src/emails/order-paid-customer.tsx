import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderPaidCustomerEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Paid" isAdmin={false} />;
}
