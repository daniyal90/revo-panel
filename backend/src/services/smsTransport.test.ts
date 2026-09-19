import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPermanentProviderError } from './smsTransport';

describe('smsTransport helpers', () => {
  it('detects permanent provider failures', () => {
    assert.equal(isPermanentProviderError('SMPP bind failed: AUTH_FAILED'), true);
    assert.equal(isPermanentProviderError('temporary timeout'), false);
  });
});
