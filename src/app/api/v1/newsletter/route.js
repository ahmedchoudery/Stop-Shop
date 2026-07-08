import { withRoute } from '@/lib/api/withRoute';
import Subscriber from '@/models/Subscriber';
import { z } from 'zod';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      email: z.string().trim().email('Invalid email address')
    })
  },
  handler: async ({ body }) => {
    const { email } = body;
    await Subscriber.findOneAndUpdate({ email }, { email }, { upsert: true });
    return { message: 'Subscribed successfully' };
  }
});
