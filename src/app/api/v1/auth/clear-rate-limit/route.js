import { withRoute } from '@/lib/api/withRoute';
import LoginAttempt from '@/models/LoginAttempt';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async () => {
    await LoginAttempt.deleteMany({});
    return { success: true, message: 'All login rate limits cleared successfully!' };
  }
});
