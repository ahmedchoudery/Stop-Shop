import { withRoute } from '@/lib/api/withRoute';
import { z } from 'zod';
// @ts-ignore
import logger from '@/utils/logger.js';

const vitalsSchema = z.object({
  name: z.enum(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  id: z.string().optional(),
  navigationType: z.string().optional(),
  url: z.string().optional(),
});

export const POST = withRoute({
  requiredRole: 'public',
  schema: { body: vitalsSchema },
  handler: async ({ body }) => {
    logger.info({ webVitals: body }, `[Web Vitals] Received ${body.name} metric: ${body.value}`);
    return new Response(null, { status: 204 });
  },
});
