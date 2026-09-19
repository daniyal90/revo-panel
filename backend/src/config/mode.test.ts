import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getAppMode, isDemoMode, isProductionMode } from './mode';

describe('mode config', () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it('treats LAMIX_MODE=production as non-demo even if DEMO_MODE=true', () => {
    process.env.LAMIX_MODE = 'production';
    process.env.DEMO_MODE = 'true';
    assert.equal(isProductionMode(), true);
    assert.equal(isDemoMode(), false);
    assert.equal(getAppMode(), 'production');
  });

  it('enables demo only when DEMO_MODE=true and not production', () => {
    delete process.env.LAMIX_MODE;
    process.env.DEMO_MODE = 'true';
    assert.equal(isDemoMode(), true);
    assert.equal(getAppMode(), 'demo');
  });
});
