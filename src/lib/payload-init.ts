import payload from 'payload';
import config from '../../../payload.config';

let payloadInstance: any = null;

export async function initPayload() {
  if (payloadInstance) {
    return payloadInstance;
  }

  try {
    payloadInstance = await payload.init({
      config,
      secret: process.env.PAYLOAD_SECRET,
      mongoURL: process.env.MONGODB_URI,
    });

    return payloadInstance;
  } catch (error) {
    console.error('Failed to initialize Payload:', error);
    throw error;
  }
}