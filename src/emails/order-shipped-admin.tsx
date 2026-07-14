import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderShippedAdminEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Shipped" isAdmin={true} />;
}
