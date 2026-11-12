import { describe, expect, it } from 'vitest';
import { SHARED_PACKAGE_NAME } from '@saas-o-matic/shared';

describe('backend sanity', () => {
  it('resolves the shared workspace package', () => {
    expect(SHARED_PACKAGE_NAME).toBe('@saas-o-matic/shared');
  });
});
