import { withRoute } from '@/lib/api/withRoute';
import Settings from '@/models/Settings';
import { updateSettingsSchema } from '@/schemas/validation';
import { logAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

export const GET = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    const s = await Settings.findOne().lean();
    const data = s ?? { announcement: 'Welcome to Stop & Shop - E2E Test Store', logo: '' };
    if (data._id) {
      data._id = data._id.toString();
    }
    return data;
  }
});

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: updateSettingsSchema
  },
  handler: async ({ req, body, user }) => {
    const settings = await Settings.findOneAndUpdate({}, body, { new: true, upsert: true }).lean();
    await logAudit('SETTINGS_UPDATE', { changed: Object.keys(body) }, user?.email || '', req);
    await cacheService.del(CACHE_KEYS.SETTINGS);

    if (settings._id) {
      settings._id = settings._id.toString();
    }

    return { message: 'Settings updated', settings };
  }
});
