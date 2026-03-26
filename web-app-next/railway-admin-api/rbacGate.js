import jwt from 'jsonwebtoken';
import { config } from './config.js';

/**
 * rbacGate ensures the incoming request has a valid JWT, 
 * and the user possesses 'admin' role or is in the allowed emails list.
 */
export const rbacGate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Check baseline role or configuration override list
    const hasAdminRole = decoded.role === 'admin';
    const isAllowedEmail = decoded.email && config.allowedEmails.includes(decoded.email.toLowerCase());

    if (!hasAdminRole && !isAllowedEmail) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * requireRole: Granular role validation mapping applied sequentially after rbacGate.
 * Restricts the execution boundaries to specifically required explicit roles.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires explicit [${allowedRoles.join(' or ')}] access.` });
    }
    next();
  };
};

/**
 * requireStage: Hardens API surfaces by globally obfuscating isolated features 
 * from rendering their existence outside of designated staging thresholds.
 */
export const requireStage = (...allowedStages) => {
  return (req, res, next) => {
    if (!allowedStages.includes(config.rbacStage)) {
      return res.status(404).json({ error: 'Not Found' });
    }
    next();
  };
};
