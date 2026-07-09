import { withRoute } from '@/lib/api/withRoute';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async ({ requestId }) => {
    throw new Error(`Sentry Test Error from request ${requestId}`);
  }
});
