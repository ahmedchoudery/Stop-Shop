import { withRoute } from '@/lib/api/withRoute';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async () => {
    try {
      const settings = await Settings.findOne().lean();
      const data = settings ?? { announcement: 'Welcome to Stop & Shop - E2E Test Store', logo: '', lowStockThreshold: 5 };

      if (data._id) {
        data._id = data._id.toString();
      }

      return data;
    } catch {
      return { announcement: 'Welcome to Stop & Shop - E2E Test Store', logo: '', lowStockThreshold: 5 };
    }
  }
});
