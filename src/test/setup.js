import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import dotenv from 'dotenv';

dotenv.config();


process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-admin-jwt-secret-key-32-chars-long';
process.env.CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'test-customer-jwt-secret-key-32-chars-long';

afterEach(() => {
  cleanup();
});

global.expect = expect;

