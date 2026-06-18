import PaymentGateway from './PaymentGateway.js';

export default class CODGateway extends PaymentGateway {
  constructor() {
    super('COD');
  }

  async authorize(order, paymentDetails) {
    return {
      success: true,
      transactionID: `COD-${order.orderID}`,
      account: 'Cash',
      brand: 'COD',
      status: 'Pending', // Payment starts as Pending for COD
      logs: { action: 'COD_ORDER_AUTHORIZED', details: { message: 'Order placed via Cash on Delivery' } },
    };
  }

  async verify(order, transactionID) {
    return {
      success: true,
      message: 'COD payments do not require real-time verification',
    };
  }

  async refund(order, reason) {
    return {
      success: true,
      transactionID: `REF-COD-${order.orderID}`,
      message: 'Cash refund logged successfully',
    };
  }
}
