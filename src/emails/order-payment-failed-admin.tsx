import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderPaymentFailedAdminEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Failed" isAdmin={true} />;
}
