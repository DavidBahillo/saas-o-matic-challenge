import { describe, expect, it } from 'vitest';
import { SHARED_PACKAGE_NAME } from './index';

describe('shared sanity', () => {
  it('exposes the package name from the public entry point', () => {
    expect(SHARED_PACKAGE_NAME).toBe('@saas-o-matic/shared');
  });
});
