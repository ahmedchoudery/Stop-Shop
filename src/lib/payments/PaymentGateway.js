export default class PaymentGateway {
  constructor(name) {
    this.name = name;
  }

  /**
   * Process payment authorization / charge.
   * @param {Object} order - The Order Mongoose document.
   * @param {Object} [paymentDetails] - Raw details from the client checkout request.
   * @returns {Promise<{ success: boolean, transactionID?: string, account?: string, brand?: string, error?: string, logs?: Object }>}
   */
  async authorize(order, paymentDetails) {
    throw new Error('Method authorize() must be implemented');
  }

  /**
   * Manually verify a payment (e.g. for OTC manual transfers).
   * @param {Object} order - The Order Mongoose document.
   * @param {string} transactionID - The TID to verify.
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async verify(order, transactionID) {
    throw new Error('Method verify() must be implemented');
  }

  /**
   * Process refund on the gateway.
   * @param {Object} order - The Order Mongoose document.
   * @param {string} [reason] - Reason for the refund.
   * @returns {Promise<{ success: boolean, transactionID?: string, error?: string }>}
   */
  async refund(order, reason) {
    throw new Error('Method refund() must be implemented');
  }
}
