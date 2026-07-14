import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderCancelledAdminEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Cancelled" isAdmin={true} />;
}
