// Mock constants to avoid importing native modules in tests
jest.mock('../../../constants/silencelabs', () => ({
  DEFAULT_TESTNET_CHAIN: { id: 0 },
}));

import { getWalletInfo, validatePrivateKey, generateTestWallet, createWalletFromPrivateKey } from '../walletTestUtils';

describe('walletTestUtils', () => {
  test('validatePrivateKey returns true for valid key', () => {
    const key = '0x' + 'a'.repeat(64);
    expect(validatePrivateKey(key)).toBe(true);
  });

  test('validatePrivateKey returns false for invalid key', () => {
    expect(validatePrivateKey('0x123')).toBe(false);
    expect(validatePrivateKey('zz'.repeat(32))).toBe(false);
  });

  test('getWalletInfo returns expected structure', () => {
    const wallet = { address: '0x' + 'b'.repeat(40), privateKey: '0x' + 'c'.repeat(64) } as any;
    const info = getWalletInfo(wallet);
    expect(info.address).toBe(wallet.address);
    expect(info.privateKey).toBe(wallet.privateKey);
    expect(info.shortAddress).toBe(wallet.address.slice(0,6) + '...' + wallet.address.slice(-4));
    expect(info.hasPrivateKey).toBe(true);
    expect(info.hasMnemonic).toBe(false);
  });

  test('generateTestWallet and createWalletFromPrivateKey produce valid wallets', async () => {
    const generated = await generateTestWallet();
    expect(validatePrivateKey(generated.privateKey)).toBe(true);
    expect(generated.address).toMatch(/^0x[0-9a-fA-F]{40}$/);

    const recreated = await createWalletFromPrivateKey(generated.privateKey);
    expect(recreated.address.toLowerCase()).toBe(generated.address.toLowerCase());
  });
});
