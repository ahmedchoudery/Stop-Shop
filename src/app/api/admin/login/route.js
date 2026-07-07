import { POST as authLogin } from '../../auth/login/route.js';

export async function POST(req) {
  return authLogin(req);
}
