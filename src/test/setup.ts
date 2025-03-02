import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { mockAnimationsApi } from 'jsdom-testing-mocks'

mockAnimationsApi()

// Clean up after each test
afterEach(() => {
  cleanup();
});
