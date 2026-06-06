import { describe, it, expect, vi } from 'vitest';
import logger from '../utils/logger.js';

describe('Winston Logger Utility', () => {
  it('should export a valid Winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeTypeOf('function');
    expect(logger.warn).toBeTypeOf('function');
    expect(logger.error).toBeTypeOf('function');
  });

  it('should support logging info, warn, and error levels', () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const warnSpy = vi.spyOn(logger, 'warn');
    const errorSpy = vi.spyOn(logger, 'error');

    logger.info('Test info message', { test: true });
    logger.warn('Test warn message', { test: true, security: true });
    logger.error('Test error message', { error: new Error('test') });

    expect(infoSpy).toHaveBeenCalledWith(
      'Test info message',
      expect.objectContaining({ test: true })
    );

    expect(warnSpy).toHaveBeenCalledWith(
      'Test warn message',
      expect.objectContaining({ test: true, security: true })
    );

    expect(errorSpy).toHaveBeenCalledWith(
      'Test error message',
      expect.objectContaining({ error: expect.any(Error) })
    );

    vi.restoreAllMocks();
  });
});
