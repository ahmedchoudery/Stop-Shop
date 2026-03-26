import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev-rbac',
  allowedEmails: (process.env.ADMIN_EMAILS || 'admin@example.com').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
  environment: process.env.NODE_ENV || 'development'
};
