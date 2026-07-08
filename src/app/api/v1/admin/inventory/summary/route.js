import { withRoute } from '@/lib/api/withRoute';
import Inventory from '@/models/Inventory';

export const GET = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    const [summary] = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalProducts:  { $sum: 1 },
          totalStock:     { $sum: '$totalStock' },
          inStock:        { $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] } },
          lowStock:       { $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] } },
          outOfStock:     { $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] } },
        },
      },
    ]);

    const byCategory = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$totalStock' } } },
      { $sort: { totalStock: -1 } },
    ]);

    return { ...(summary ?? {}), byCategory };
  }
});
