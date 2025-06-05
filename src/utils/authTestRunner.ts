import { generateTestWallet, createWalletFromPrivateKey, TestWallet, getWalletInfo } from './walletTestUtils';
import { WalletConnectConfig } from '../types';
import { DEFAULT_TESTNET_CHAIN } from '../../constants/thirdweb';

export interface AuthTestResult {
  success: boolean;
  wallet?: TestWallet;
  walletAddress?: string;
  authToken?: string;
  error?: string;
  duration?: number;
}

export interface AuthTestOptions {
  useExistingWallet?: boolean;
  existingPrivateKey?: string;
  walletName?: string;
  saveWallet?: boolean;
  testChain?: any;
}

/**
 * Run automated external wallet authentication test
 */
export async function runExternalWalletAuthTest(
  authHook: any,
  options: AuthTestOptions = {}
): Promise<AuthTestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Starting External Wallet Authentication Test...');
    console.log('📋 Test Options:', options);

    // Step 1: Generate or load test wallet
    let testWallet: TestWallet;
    
    if (options.useExistingWallet && options.existingPrivateKey) {
      console.log('🔑 Using existing private key...');
      testWallet = await createWalletFromPrivateKey(options.existingPrivateKey);
    } else {
      console.log('🆕 Generating new test wallet...');
      testWallet = await generateTestWallet({
        name: options.walletName || 'auth-test-wallet',
        saveToStorage: options.saveWallet || true,
      });
    }

    const walletInfo = getWalletInfo(testWallet);
    console.log('👛 Test Wallet Info:', walletInfo);

    // Step 2: Configure wallet connection
    const walletConfig: WalletConnectConfig = {
      strategy: 'wallet',
      wallet: testWallet.wallet,
      chain: options.testChain || DEFAULT_TESTNET_CHAIN,
      testWallet: testWallet,
    };

    console.log('⚙️ Wallet Configuration:', {
      strategy: walletConfig.strategy,
      chain: walletConfig.chain?.name || 'Unknown',
      address: testWallet.address,
    });

    // Step 3: Attempt authentication
    console.log('🔐 Starting authentication process...');
    
    await authHook.login(walletConfig);

    // Step 4: Verify authentication
    if (authHook.isAuthenticated && authHook.user) {
      const duration = Date.now() - startTime;
      
      console.log('✅ Authentication Test PASSED!');
      console.log('📊 Test Results:', {
        authenticated: authHook.isAuthenticated,
        userWalletAddress: authHook.user.walletAddress,
        testWalletAddress: testWallet.address,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        wallet: testWallet,
        walletAddress: testWallet.address,
        authToken: 'generated', // The actual token is managed by the auth hook
        duration,
      };
    } else {
      throw new Error('Authentication completed but user is not authenticated');
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Authentication Test FAILED!');
    console.error('💥 Error:', error.message);
    console.error('📊 Test Duration:', `${duration}ms`);

    return {
      success: false,
      error: error.message,
      duration,
    };
  }
}

/**
 * Run multiple authentication tests with different wallets
 */
export async function runBatchAuthTests(
  authHook: any,
  testCount: number = 3,
  options: AuthTestOptions = {}
): Promise<AuthTestResult[]> {
  console.log(`🧪 Running ${testCount} batch authentication tests...`);
  
  const results: AuthTestResult[] = [];
  
  for (let i = 1; i <= testCount; i++) {
    console.log(`\n🔄 Running Test ${i}/${testCount}...`);
    
    const testOptions: AuthTestOptions = {
      ...options,
      walletName: `batch-test-wallet-${i}`,
      useExistingWallet: false, // Always generate new wallets for batch tests
    };
    
    const result = await runExternalWalletAuthTest(authHook, testOptions);
    results.push(result);
    
    // Log out between tests to reset state
    if (authHook.isAuthenticated) {
      console.log('👋 Logging out to reset state...');
      await authHook.logout();
      
      // Wait a moment for logout to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  
  console.log('\n📊 Batch Test Summary:');
  console.log(`✅ Successful: ${successful}/${testCount}`);
  console.log(`❌ Failed: ${failed}/${testCount}`);
  console.log(`⏱️ Average Duration: ${avgDuration.toFixed(0)}ms`);
  
  return results;
}

/**
 * Test authentication with a pre-generated wallet
 */
export async function testWithExistingWallet(
  authHook: any,
  privateKey: string,
  walletName: string = 'existing-test-wallet'
): Promise<AuthTestResult> {
  return runExternalWalletAuthTest(authHook, {
    useExistingWallet: true,
    existingPrivateKey: privateKey,
    walletName,
    saveWallet: true,
  });
}

/**
 * Generate test wallets for later use
 */
export async function generateTestWalletsForLater(
  count: number = 5
): Promise<TestWallet[]> {
  console.log(`🏭 Generating ${count} test wallets for later use...`);
  
  const wallets: TestWallet[] = [];
  
  for (let i = 1; i <= count; i++) {
    const wallet = await generateTestWallet({
      name: `pre-generated-${i}`,
      saveToStorage: true,
    });
    
    wallets.push(wallet);
    console.log(`📦 Generated wallet ${i}: ${wallet.address}`);
  }
  
  console.log('✅ All test wallets generated and saved!');
  return wallets;
}

/**
 * Stress test authentication system
 */
export async function runStressTest(
  authHook: any,
  options: {
    testCount?: number;
    concurrentTests?: number;
    delayBetweenTests?: number;
  } = {}
): Promise<AuthTestResult[]> {
  const {
    testCount = 10,
    concurrentTests = 3,
    delayBetweenTests = 500,
  } = options;
  
  console.log(`🏋️ Starting Authentication Stress Test...`);
  console.log(`📊 Config: ${testCount} tests, ${concurrentTests} concurrent, ${delayBetweenTests}ms delay`);
  
  const results: AuthTestResult[] = [];
  const batches: Promise<AuthTestResult>[][] = [];
  
  // Split tests into concurrent batches
  for (let i = 0; i < testCount; i += concurrentTests) {
    const batch: Promise<AuthTestResult>[] = [];
    
    for (let j = 0; j < concurrentTests && i + j < testCount; j++) {
      const testNumber = i + j + 1;
      
      const testPromise = runExternalWalletAuthTest(authHook, {
        walletName: `stress-test-${testNumber}`,
        saveWallet: false, // Don't save wallets during stress test
      });
      
      batch.push(testPromise);
    }
    
    batches.push(batch);
  }
  
  // Run batches sequentially, tests within batch concurrently
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    console.log(`\n🔄 Running batch ${batchIndex + 1}/${batches.length}...`);
    
    const batchResults = await Promise.allSettled(batches[batchIndex]);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });
    
    // Delay between batches
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenTests));
    }
  }
  
  // Stress test summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  
  console.log('\n🏋️ Stress Test Summary:');
  console.log(`✅ Successful: ${successful}/${testCount} (${((successful/testCount)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed}/${testCount} (${((failed/testCount)*100).toFixed(1)}%)`);
  console.log(`⏱️ Average Duration: ${avgDuration.toFixed(0)}ms`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Test Errors:');
    results
      .filter(r => !r.success)
      .forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.error}`);
      });
  }
  
  return results;
}

/**
 * Simple helper to run a quick authentication test
 */
export async function quickAuthTest(authHook: any): Promise<boolean> {
  console.log('⚡ Running quick authentication test...');
  
  const result = await runExternalWalletAuthTest(authHook, {
    walletName: 'quick-test',
    saveWallet: false,
  });
  
  if (result.success) {
    console.log('✅ Quick test passed!');
    return true;
  } else {
    console.log('❌ Quick test failed:', result.error);
    return false;
  }
}

export default {
  runExternalWalletAuthTest,
  runBatchAuthTests,
  testWithExistingWallet,
  generateTestWalletsForLater,
  runStressTest,
  quickAuthTest,
};
