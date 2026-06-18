import { describe, it, expect } from 'vitest';
import paymentFactory from '../lib/payments/PaymentFactory.js';
import CODGateway from '../lib/payments/CODGateway.js';
import EasypaisaGateway from '../lib/payments/EasypaisaGateway.js';
import CardGateway from '../lib/payments/CardGateway.js';

describe('PaymentFactory', () => {
  it('should return the correct gateway instances', () => {
    expect(paymentFactory.get('COD')).toBeInstanceOf(CODGateway);
    expect(paymentFactory.get('Easypaisa')).toBeInstanceOf(EasypaisaGateway);
    expect(paymentFactory.get('ATM Card')).toBeInstanceOf(CardGateway);
    expect(paymentFactory.get('JazzCash')).toBeInstanceOf(EasypaisaGateway);
    expect(paymentFactory.get('Bank Transfer')).toBeInstanceOf(EasypaisaGateway);
  });

  it('should throw an error for unsupported payment methods', () => {
    expect(() => paymentFactory.get('Bitcoin')).toThrow('Unsupported payment method: Bitcoin');
  });
});

describe('CODGateway', () => {
  const gateway = paymentFactory.get('COD');
  const mockOrder = { orderID: 'TEST-COD-123', total: 1500 };

  it('should authorize COD order successfully', async () => {
    const res = await gateway.authorize(mockOrder);
    expect(res.success).toBe(true);
    expect(res.transactionID).toBe('COD-TEST-COD-123');
    expect(res.status).toBe('Pending');
    expect(res.account).toBe('Cash');
  });

  it('should verify COD order successfully without verification logic', async () => {
    const res = await gateway.verify(mockOrder, 'COD-TEST-COD-123');
    expect(res.success).toBe(true);
  });

  it('should log cash refund successfully', async () => {
    const res = await gateway.refund(mockOrder);
    expect(res.success).toBe(true);
    expect(res.transactionID).toBe('REF-COD-TEST-COD-123');
  });
});

describe('CardGateway', () => {
  const gateway = paymentFactory.get('ATM Card');
  const mockOrder = { orderID: 'TEST-CARD-123', total: 2500, paymentDetails: { status: 'Paid', paymentAccount: '•••• •••• •••• 1111' } };

  it('should reject authorize if card details are missing', async () => {
    const res = await gateway.authorize(mockOrder, null);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Card details are required');
  });

  it('should reject invalid cardholder name', async () => {
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'A',
      cardNumber: '4111111111111111',
      cardExpiry: '12/29',
      cardCvv: '123'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid cardholder name');
  });

  it('should reject invalid Luhn card number', async () => {
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'Ahmed Khan',
      cardNumber: '4000123456789011', // invalid luhn sum
      cardExpiry: '12/29',
      cardCvv: '123'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid card number');
  });

  it('should reject invalid card expiry format', async () => {
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'Ahmed Khan',
      cardNumber: '4111111111111111', // valid luhn
      cardExpiry: '2029',
      cardCvv: '123'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Expiry date must be in MM/YY format');
  });

  it('should reject invalid CVV format', async () => {
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'Ahmed Khan',
      cardNumber: '4111111111111111', // valid luhn
      cardExpiry: '12/29',
      cardCvv: '12'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('CVV must be 3 or 4 digits');
  });

  it('should authorize successful card payment', async () => {
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'Ahmed Khan',
      cardNumber: '4111111111111111', // valid luhn visa
      cardExpiry: '12/29',
      cardCvv: '123'
    });
    expect(res.success).toBe(true);
    expect(res.status).toBe('Paid');
    expect(res.brand).toBe('Visa');
    expect(res.account).toBe('•••• •••• •••• 1111');
    expect(res.transactionID).toContain('TXN-CARD-');
  });

  it('should decline card ending with 0000', async () => {
    // 4000000000100000 is valid Luhn and ends with 0000
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'Ahmed Khan',
      cardNumber: '4000000000100000',
      cardExpiry: '12/29',
      cardCvv: '123'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Authorization failed: Insufficient funds');
  });

  it('should decline card with 999 CVV security code', async () => {
    const res = await gateway.authorize(mockOrder, {
      cardholderName: 'Ahmed Khan',
      cardNumber: '4111111111111111',
      cardExpiry: '12/29',
      cardCvv: '999'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Incorrect CVV security code');
  });

  it('should refund paid card order successfully', async () => {
    const res = await gateway.refund(mockOrder, 'Defective product');
    expect(res.success).toBe(true);
    expect(res.transactionID).toContain('REF-CARD-');
  });

  it('should fail refund if order payment status is not Paid', async () => {
    const unpaidOrder = { ...mockOrder, paymentDetails: { status: 'Pending' } };
    const res = await gateway.refund(unpaidOrder);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Only paid orders can be refunded');
  });
});

describe('EasypaisaGateway', () => {
  const gateway = paymentFactory.get('Easypaisa');
  const mockOrder = { orderID: 'TEST-EP-123', total: 3000, paymentDetails: { status: 'Paid' } };

  it('should reject authorization if paymentDetails are missing', async () => {
    const res = await gateway.authorize(mockOrder, null);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Easypaisa payment details are required');
  });

  it('should handle direct wallet payment with mobile number verification', async () => {
    const res = await gateway.authorize(mockOrder, {
      easypaisaMode: 'direct',
      easypaisaNumber: '03001234567'
    });
    expect(res.success).toBe(true);
    expect(res.status).toBe('Paid');
    expect(res.account).toBe('03001234567');
    expect(res.transactionID).toContain('EP-DIR-');
  });

  it('should reject invalid direct mobile number', async () => {
    const res = await gateway.authorize(mockOrder, {
      easypaisaMode: 'direct',
      easypaisaNumber: 'invalid'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid Easypaisa mobile account number');
  });

  it('should handle manual OTC payment with 11-digit alphanumeric TID', async () => {
    const res = await gateway.authorize(mockOrder, {
      easypaisaMode: 'manual',
      easypaisaTid: 'ABC123XYZ78'
    });
    expect(res.success).toBe(true);
    expect(res.status).toBe('Pending');
    expect(res.transactionID).toBe('ABC123XYZ78');
  });

  it('should reject manual OTC payment with invalid TID format', async () => {
    const res = await gateway.authorize(mockOrder, {
      easypaisaMode: 'manual',
      easypaisaTid: 'short123'
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Transaction ID must be exactly 11 alphanumeric characters');
  });

  it('should verify TID manually successfully', async () => {
    const res = await gateway.verify(mockOrder, 'ABC123XYZ78');
    expect(res.success).toBe(true);
    expect(res.transactionID).toBe('ABC123XYZ78');
  });

  it('should reject verification with invalid TID format', async () => {
    const res = await gateway.verify(mockOrder, 'short123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid verification Transaction ID format');
  });

  it('should refund paid Easypaisa order successfully', async () => {
    const res = await gateway.refund(mockOrder, 'Customer canceled');
    expect(res.success).toBe(true);
    expect(res.transactionID).toContain('EP-REF-');
  });
});
