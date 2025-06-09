// Mock constants to avoid importing native modules in tests
jest.mock('../../../constants/silencelabs', () => ({
  DEFAULT_TESTNET_CHAIN: { id: 11155111 },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    getAllKeys: jest.fn().mockResolvedValue([]),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('ethers', () => {
  return {
    Wallet: class {
      address: string;
      constructor(privateKey: string) {
        this.address =
          '0x' + privateKey.replace(/^0x/, '').slice(-40).padStart(40, '0');
      }
      getAddress() {
        return this.address;
      }
    },
  };
});

import * as walletUtils from '../walletTestUtils';

describe('walletTestUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('validatePrivateKey returns true for valid key', () => {
    const key = '0x' + 'a'.repeat(64);
    expect(walletUtils.validatePrivateKey(key)).toBe(true);
  });

  test('validatePrivateKey returns false for invalid key', () => {
    expect(walletUtils.validatePrivateKey('0x123')).toBe(false);
    expect(walletUtils.validatePrivateKey('zz'.repeat(32))).toBe(false);
  });

  test('getWalletInfo returns expected structure', () => {
    const wallet = { address: '0x' + 'b'.repeat(40), privateKey: '0x' + 'c'.repeat(64) } as any;
    const info = walletUtils.getWalletInfo(wallet);
    expect(info.address).toBe(wallet.address);
    expect(info.privateKey).toBe(wallet.privateKey);
    expect(info.shortAddress).toBe(wallet.address.slice(0,6) + '...' + wallet.address.slice(-4));
    expect(info.hasPrivateKey).toBe(true);
    expect(info.hasMnemonic).toBe(false);
  });

  test('generateTestWallet and createWalletFromPrivateKey produce valid wallets', async () => {
    const generated = await walletUtils.generateTestWallet();
    expect(walletUtils.validatePrivateKey(generated.privateKey)).toBe(true);
    expect(generated.address).toMatch(/^0x[0-9a-fA-F]{40}$/);

    const recreated = await walletUtils.createWalletFromPrivateKey(generated.privateKey);
    expect(recreated.address.toLowerCase()).toBe(generated.address.toLowerCase());
  });

  test('saveTestWallet stores data in AsyncStorage', async () => {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const wallet = { address: '0xabc', privateKey: '0x' + 'd'.repeat(64), wallet: {} } as any;
    await walletUtils.saveTestWallet(wallet, 'unit');
    expect(AsyncStorage.default.setItem).toHaveBeenCalledWith(
      'interspace_test_wallet_unit',
      expect.any(String)
    );
  });

  test('loadTestWallet returns wallet when found', async () => {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const stored = { address: '0xabc', privateKey: '0x' + 'e'.repeat(64), mnemonic: 'test' };
    (AsyncStorage.default.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));
    const createSpy = jest
      .spyOn(walletUtils, 'createWalletFromPrivateKey')
      .mockResolvedValueOnce({ address: stored.address, privateKey: stored.privateKey, wallet: {} } as any);
    const wallet = await walletUtils.loadTestWallet('unit');
    expect(createSpy).toHaveBeenCalledWith(stored.privateKey);
    expect(wallet).toEqual({ address: stored.address, privateKey: stored.privateKey, wallet: {}, mnemonic: stored.mnemonic });
  });

  test('listTestWallets returns stored wallet names', async () => {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    (AsyncStorage.default.getAllKeys as jest.Mock).mockResolvedValueOnce([
      'interspace_test_wallet_one',
      'interspace_test_wallet_two',
    ]);
    const result = await walletUtils.listTestWallets();
    expect(result).toEqual(['one', 'two']);
  });

  test('deleteTestWallet removes item from storage', async () => {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await walletUtils.deleteTestWallet('unit');
    expect(AsyncStorage.default.removeItem).toHaveBeenCalledWith('interspace_test_wallet_unit');
  });

  test('requestTestnetTokens logs faucet information', async () => {
    const wallet = { address: '0xabc', privateKey: '0x' + 'f'.repeat(64), wallet: {} } as any;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await walletUtils.requestTestnetTokens(wallet, 11155111);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
