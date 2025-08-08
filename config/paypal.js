import paypal from '@paypal/checkout-server-sdk';
import 'dotenv/config';

// Determina el entorno
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

// Crea el cliente de PayPal
const client = new paypal.core.PayPalHttpClient(environment);

export default client;