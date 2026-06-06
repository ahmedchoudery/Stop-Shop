import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// Custom format for console logging (clean, readable, colorized)
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  // Exclude 'security' boolean from log output to keep console clean
  const { security, ...cleanMeta } = meta;
  const metaString = Object.keys(cleanMeta).length ? ` | ${JSON.stringify(cleanMeta)}` : '';
  return `[${timestamp}] ${level}: ${stack || message}${metaString}`;
});

// Create the winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    // Error log: logs all 'error' level messages
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Security log: captures security warnings, lockouts, failed logins, etc.
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format((info) => {
          // Only capture logs tagged with security: true OR level warning/error
          if (info.security === true || info.level === 'warn' || info.level === 'error') {
            return info;
          }
          return false;
        })(),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log: logs everything
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// For non-production environments, colorize console logs
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      consoleFormat
    )
  }));
}

export default logger;
