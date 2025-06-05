/**
 * Demo script showing how to use the Interspace authentication testing system
 * This demonstrates the external wallet authentication testing capabilities
 */

import { useAuth } from '../hooks/useAuth';
import { 
  runExternalWalletAuthTest,
  runBatchAuthTests,
  testWithExistingWallet,
  generateTestWalletsForLater,
  runStressTest,
  quickAuthTest
} from './authTestRunner';
import { 
  generateTestWallet,
  listTestWallets,
  getWalletInfo,
  validatePrivateKey
} from './walletTestUtils';

/**
 * Demo: Quick authentication test
 * This is the simplest way to test external wallet authentication
 */
export async function demoQuickTest(authHook: any): Promise<void> {
  console.log('\n🚀 DEMO: Quick Authentication Test');
  console.log('=====================================');
  
  const success = await quickAuthTest(authHook);
  
  if (success) {
    console.log('✅ Quick test demonstration completed successfully!');
  } else {
    console.log('❌ Quick test demonstration failed.');
  }
}

/**
 * Demo: Single wallet authentication test
 * Shows how to test authentication with a single generated wallet
 */
export async function demoSingleWalletTest(authHook: any): Promise<void> {
  console.log('\n🎯 DEMO: Single Wallet Authentication Test');
  console.log('===========================================');
  
  const result = await runExternalWalletAuthTest(authHook, {
    walletName: 'demo-single-wallet',
    saveWallet: true,
  });
  
  console.log('📊 Test Result:', {
    success: result.success,
    walletAddress: result.walletAddress,
    duration: result.duration ? `${result.duration}ms` : 'N/A',
    error: result.error || 'None',
  });
  
  if (result.success && result.wallet) {
    const walletInfo = getWalletInfo(result.wallet);
    console.log('👛 Wallet Info:', walletInfo);
  }
}

/**
 * Demo: Batch testing with multiple wallets
 * Shows how to test authentication with multiple generated wallets
 */
export async function demoBatchWalletTests(authHook: any): Promise<void> {
  console.log('\n📦 DEMO: Batch Wallet Authentication Tests');
  console.log('===========================================');
  
  const results = await runBatchAuthTests(authHook, 3, {
    saveWallet: false, // Don't save wallets during batch testing
  });
  
  console.log('📈 Batch Test Summary:');
  results.forEach((result, index) => {
    console.log(`  Test ${index + 1}: ${result.success ? '✅ PASS' : '❌ FAIL'} (${result.duration}ms)`);
    if (!result.success) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  const successRate = (results.filter(r => r.success).length / results.length) * 100;
  console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
}

/**
 * Demo: Testing with a pre-generated wallet
 * Shows how to use an existing private key for testing
 */
export async function demoExistingWalletTest(authHook: any): Promise<void> {
  console.log('\n🔑 DEMO: Existing Wallet Authentication Test');
  console.log('=============================================');
  
  // First, generate a test wallet to demonstrate with
  console.log('🏭 Generating a test wallet for demonstration...');
  const testWallet = await generateTestWallet({
    name: 'demo-existing-wallet',
    saveToStorage: true,
  });
  
  console.log('✅ Test wallet generated:', testWallet.address);
  console.log('🔑 Private Key:', testWallet.privateKey);
  
  // Validate the private key format
  const isValidKey = validatePrivateKey(testWallet.privateKey);
  console.log('🔍 Private key validation:', isValidKey ? '✅ Valid' : '❌ Invalid');
  
  // Now test authentication with this existing wallet
  console.log('🧪 Testing authentication with existing wallet...');
  const result = await testWithExistingWallet(
    authHook,
    testWallet.privateKey,
    'demo-existing-wallet-test'
  );
  
  console.log('📊 Existing Wallet Test Result:', {
    success: result.success,
    walletAddress: result.walletAddress,
    duration: result.duration ? `${result.duration}ms` : 'N/A',
    error: result.error || 'None',
  });
}

/**
 * Demo: Generate test wallets for later use
 * Shows how to pre-generate wallets for testing purposes
 */
export async function demoGenerateTestWallets(): Promise<void> {
  console.log('\n🏭 DEMO: Generate Test Wallets for Later Use');
  console.log('==============================================');
  
  console.log('🔄 Generating 3 test wallets...');
  const wallets = await generateTestWalletsForLater(3);
  
  console.log('📋 Generated Wallets:');
  wallets.forEach((wallet, index) => {
    const info = getWalletInfo(wallet);
    console.log(`  ${index + 1}. ${info.shortAddress} (${info.hasPrivateKey ? 'Has Key' : 'No Key'})`);
  });
  
  // List all saved test wallets
  console.log('💾 All saved test wallets:');
  const savedWallets = await listTestWallets();
  savedWallets.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
}

/**
 * Demo: Stress testing the authentication system
 * Shows how to perform load testing on the authentication system
 */
export async function demoStressTest(authHook: any): Promise<void> {
  console.log('\n🏋️ DEMO: Authentication Stress Test');
  console.log('====================================');
  
  console.log('⚠️  This will perform 5 concurrent authentication tests...');
  
  const results = await runStressTest(authHook, {
    testCount: 5,
    concurrentTests: 2,
    delayBetweenTests: 1000,
  });
  
  console.log('📊 Stress Test Results:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('❌ Failed Test Errors:');
    results
      .filter(r => !r.success)
      .forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.error}`);
      });
  }
}

/**
 * Demo: Complete authentication testing workflow
 * Shows a complete testing workflow with all features
 */
export async function demoCompleteWorkflow(authHook: any): Promise<void> {
  console.log('\n🎬 DEMO: Complete Authentication Testing Workflow');
  console.log('==================================================');
  
  try {
    // 1. Quick test to verify system works
    console.log('\n📍 Step 1: Quick system verification...');
    await demoQuickTest(authHook);
    
    // 2. Generate test wallets for later use
    console.log('\n📍 Step 2: Generate test wallets...');
    await demoGenerateTestWallets();
    
    // 3. Single wallet detailed test
    console.log('\n📍 Step 3: Detailed single wallet test...');
    await demoSingleWalletTest(authHook);
    
    // 4. Test with existing wallet
    console.log('\n📍 Step 4: Existing wallet test...');
    await demoExistingWalletTest(authHook);
    
    // 5. Batch testing
    console.log('\n📍 Step 5: Batch testing...');
    await demoBatchWalletTests(authHook);
    
    console.log('\n🎉 Complete workflow demonstration finished!');
    console.log('ℹ️  You can now use these testing utilities in your development workflow.');
    
  } catch (error) {
    console.error('\n❌ Workflow demonstration failed:', error);
  }
}

/**
 * Helper: Print usage instructions
 */
export function printUsageInstructions(): void {
  console.log('\n📚 INTERSPACE AUTHENTICATION TESTING GUIDE');
  console.log('============================================');
  console.log('');
  console.log('🎯 Quick Start:');
  console.log('  import { useAuth } from "./src/hooks/useAuth";');
  console.log('  import { quickAuthTest } from "./src/utils/authTestRunner";');
  console.log('  ');
  console.log('  const authHook = useAuth();');
  console.log('  await quickAuthTest(authHook);');
  console.log('');
  console.log('🧪 Available Test Functions:');
  console.log('  • quickAuthTest() - Fast single test');
  console.log('  • runExternalWalletAuthTest() - Detailed single test');
  console.log('  • runBatchAuthTests() - Multiple wallet tests');
  console.log('  • testWithExistingWallet() - Test with known private key');
  console.log('  • runStressTest() - Load testing');
  console.log('  • generateTestWalletsForLater() - Pre-generate wallets');
  console.log('');
  console.log('🛠️  Wallet Utilities:');
  console.log('  • generateTestWallet() - Create new test wallet');
  console.log('  • createWalletFromPrivateKey() - Use existing key');
  console.log('  • listTestWallets() - Show saved wallets');
  console.log('  • validatePrivateKey() - Validate key format');
  console.log('');
  console.log('💡 Example Usage in Development:');
  console.log('  // Test auth system during development');
  console.log('  await quickAuthTest(authHook);');
  console.log('  ');
  console.log('  // Generate wallets for manual testing');
  console.log('  const wallets = await generateTestWalletsForLater(5);');
  console.log('  ');
  console.log('  // Stress test before production');
  console.log('  await runStressTest(authHook, { testCount: 10 });');
  console.log('');
}

export default {
  demoQuickTest,
  demoSingleWalletTest,
  demoBatchWalletTests,
  demoExistingWalletTest,
  demoGenerateTestWallets,
  demoStressTest,
  demoCompleteWorkflow,
  printUsageInstructions,
};
