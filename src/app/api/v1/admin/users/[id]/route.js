import { withRoute, ApiError } from '@/lib/api/withRoute';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import { withAudit } from '@/lib/audit';
import { z } from 'zod';

export const DELETE = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    })
  },
  handler: async ({ req, params }) => {
    const { id } = params;

    const user = await User.findById(id).lean();
    if (!user) {
      throw new ApiError('NOT_FOUND', 'User not found', 404);
    }

    await withAudit(
      'USER_DELETE',
      user.email,
      req,
      { email: user.email },
      null,
      async (session) => {
        await User.findByIdAndDelete(id, { session });
        await UserRole.deleteMany({ userId: id }, { session });
      }
    );

    return { message: 'User deleted' };
  }
});
