import PaymentGateway from './PaymentGateway.js';

// Simple Luhn Algorithm for card number validation
function isValidLuhn(cardNumber) {
  const cleanNum = cardNumber.replace(/\D/g, '');
  if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleanNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNum.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export default class CardGateway extends PaymentGateway {
  constructor() {
    super('ATM Card');
  }

  async authorize(order, paymentDetails) {
    if (!paymentDetails) {
      return { success: false, error: 'Card details are required' };
    }

    const { cardholderName, cardNumber, cardExpiry, cardCvv } = paymentDetails;

    if (!cardholderName || cardholderName.trim().length < 2) {
      return { success: false, error: 'Invalid cardholder name' };
    }

    const cleanCardNumber = (cardNumber ?? '').replace(/\D/g, '');
    if (!cleanCardNumber || !isValidLuhn(cleanCardNumber)) {
      return { success: false, error: 'Invalid card number' };
    }

    // Expiry check (format MM/YY or MM/YYYY)
    if (!cardExpiry || !/^\d{2}\/\d{2,4}$/.test(cardExpiry)) {
      return { success: false, error: 'Expiry date must be in MM/YY format' };
    }

    // CVV check
    const cleanCvv = (cardCvv ?? '').trim();
    if (!cleanCvv || !/^\d{3,4}$/.test(cleanCvv)) {
      return { success: false, error: 'CVV must be 3 or 4 digits' };
    }

    // Mock failures
    if (cleanCardNumber.endsWith('0000')) {
      return { success: false, error: 'Authorization failed: Insufficient funds' };
    }

    if (cleanCvv === '999') {
      return { success: false, error: 'Authorization failed: Incorrect CVV security code' };
    }

    // Determine brand
    let brand = 'ATM/Debit Card';
    if (cleanCardNumber.startsWith('4')) {
      brand = 'Visa';
    } else if (cleanCardNumber.startsWith('5')) {
      brand = 'Mastercard';
    }

    const maskedCard = `•••• •••• •••• ${cleanCardNumber.slice(-4)}`;
    const tid = `TXN-CARD-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      transactionID: tid,
      account: maskedCard,
      brand: brand,
      status: 'Paid',
      logs: {
        action: 'CARD_PAYMENT_AUTHORIZED',
        details: { message: 'Card charge completed successfully', brand, maskedCard, transactionID: tid },
      },
    };
  }

  async verify(order, transactionID) {
    return {
      success: true,
      transactionID,
      message: 'Card payment verified successfully with payment provider gateway logs',
    };
  }

  async refund(order, reason = 'Customer request') {
    if (order.paymentDetails?.status !== 'Paid') {
      return { success: false, error: 'Only paid orders can be refunded' };
    }

    const refId = `REF-CARD-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      transactionID: refId,
      message: `Refunded successfully to card ${order.paymentDetails.paymentAccount}. Reason: ${reason}`,
    };
  }
}
