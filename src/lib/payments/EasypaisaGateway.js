import PaymentGateway from './PaymentGateway.js';

export default class EasypaisaGateway extends PaymentGateway {
  constructor() {
    super('Easypaisa');
  }

  async authorize(order, paymentDetails) {
    if (!paymentDetails) {
      return { success: false, error: 'Easypaisa payment details are required' };
    }

    const { easypaisaMode, easypaisaNumber, easypaisaTid } = paymentDetails;

    if (easypaisaMode === 'direct') {
      if (!easypaisaNumber || !/^\d{10,12}$/.test(easypaisaNumber.replace(/\D/g, ''))) {
        return { success: false, error: 'Invalid Easypaisa mobile account number' };
      }

      // Simulate Direct wallet push authorization success
      const tid = `EP-DIR-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString(36).toUpperCase()}`;
      return {
        success: true,
        transactionID: tid,
        account: easypaisaNumber,
        brand: 'Easypaisa Direct',
        status: 'Paid', // Instantly paid upon successful simulated OTP/USSD verification
        logs: {
          action: 'EASYPAISA_DIRECT_AUTHORIZED',
          details: { message: 'USSD push payment succeeded', mobile: easypaisaNumber, transactionID: tid },
        },
      };
    } else if (easypaisaMode === 'manual') {
      if (!easypaisaTid || !/^[A-Za-z0-9]{11}$/.test(easypaisaTid)) {
        return { success: false, error: 'Transaction ID must be exactly 11 alphanumeric characters' };
      }

      return {
        success: true,
        transactionID: easypaisaTid.toUpperCase(),
        account: 'Manual OTC Transfer',
        brand: 'Easypaisa Manual',
        status: 'Pending', // Awaits admin verification
        logs: {
          action: 'EASYPAISA_MANUAL_SUBMITTED',
          details: { message: 'Customer submitted manual Transaction ID', transactionID: easypaisaTid.toUpperCase() },
        },
      };
    }

    return { success: false, error: 'Invalid Easypaisa payment mode specified' };
  }

  async verify(order, transactionID) {
    if (!transactionID || !/^[A-Za-z0-9]{11}$/.test(transactionID)) {
      return { success: false, error: 'Invalid verification Transaction ID format' };
    }

    return {
      success: true,
      transactionID: transactionID.toUpperCase(),
      message: 'Payment successfully verified manually via Easypaisa Merchant portal',
    };
  }

  async refund(order, reason = 'Customer request') {
    if (order.paymentDetails?.status !== 'Paid') {
      return { success: false, error: 'Only paid orders can be refunded' };
    }

    const refId = `EP-REF-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      transactionID: refId,
      message: `Refund successful via Easypaisa API. Reason: ${reason}`,
    };
  }
}
