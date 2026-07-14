import * as React from 'react';
import { OrderLifecycleEmail } from './OrderLifecycleEmail';

export default function OrderDeliveredAdminEmail(props: any) {
  return <OrderLifecycleEmail {...props} status="Delivered" isAdmin={true} />;
}
