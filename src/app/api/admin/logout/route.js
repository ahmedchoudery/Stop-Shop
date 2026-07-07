import { POST as authLogout } from '../../auth/logout/route.js';

export async function POST(req) {
  return authLogout(req);
}
