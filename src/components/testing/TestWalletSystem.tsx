import React, { useState } from 'react';
import FloatingTestWallet from './FloatingTestWallet';
import TestWalletModal from './TestWalletModal';
import { useTestWallet } from '../../hooks/useTestWallet';

/**
 * Complete Test Wallet System
 * - Floating button for quick access
 * - Modal interface for wallet management
 * - Transaction and SIWE request handling
 * - Development-only visibility
 */
export default function TestWalletSystem() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isDevelopment } = useTestWallet();

  // `isDevelopment` is derived from the global `__DEV__` flag, so this entire
  // system is stripped from production builds.
  if (!isDevelopment) {
    return null;
  }

  return (
    <>
      {/* Floating Test Wallet Button */}
      <FloatingTestWallet onPress={() => setIsModalVisible(true)} />
      
      {/* Test Wallet Management Modal */}
      <TestWalletModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </>
  );
}

/**
 * Demo functions for testing the wallet system
 * These can be called from anywhere in the app during development
 */
export const testWalletDemo = {
  /**
   * Test sending a transaction
   */
  async sendTestTransaction(testWallet: any) {
    try {
      const hash = await testWallet.sendTransaction(
        '0x1234567890123456789012345678901234567890', // to
        '0.001', // value in ETH
        undefined // data
      );
      console.log('✅ Test transaction sent:', hash);
      return hash;
    } catch (error) {
      console.error('❌ Test transaction failed:', error);
      throw error;
    }
  },

  /**
   * Test SIWE signing
   */
  async signTestSIWE(testWallet: any) {
    try {
      const signature = await testWallet.signSIWE(
        'app.interspace.com',
        'Sign in to Interspace Test',
        undefined, // nonce (auto-generated)
        84532 // Base Sepolia chain ID
      );
      console.log('✅ Test SIWE signed:', signature);
      return signature;
    } catch (error) {
      console.error('❌ Test SIWE failed:', error);
      throw error;
    }
  },

  /**
   * Create and activate a test wallet quickly
   */
  async quickSetupTestWallet(testWallet: any) {
    try {
      console.log('🧪 Setting up test wallet...');
      const wallet = await testWallet.createTestWallet('Demo Wallet');
      await testWallet.setActiveTestWallet(wallet);
      console.log('✅ Test wallet ready:', wallet.address);
      return wallet;
    } catch (error) {
      console.error('❌ Test wallet setup failed:', error);
      throw error;
    }
  }
};
