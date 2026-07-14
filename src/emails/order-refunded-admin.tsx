import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderRefundedAdminEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Refunded" isAdmin={true} />;
}
