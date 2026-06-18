import CODGateway from './CODGateway.js';
import EasypaisaGateway from './EasypaisaGateway.js';
import CardGateway from './CardGateway.js';

class PaymentFactory {
  constructor() {
    this.gateways = {
      'COD':           new CODGateway(),
      'Easypaisa':     new EasypaisaGateway(),
      'ATM Card':      new CardGateway(),
      'JazzCash':      new EasypaisaGateway(), // Shares mobile wallet properties
      'Bank Transfer': new EasypaisaGateway(), // Shares manual reference validation properties
    };
  }

  /**
   * Resolves the gateway instance for a given payment method.
   * @param {string} method - The payment method string.
   * @returns {PaymentGateway} The gateway instance.
   */
  get(method) {
    const gateway = this.gateways[method];
    if (!gateway) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    return gateway;
  }
}

export default new PaymentFactory();
