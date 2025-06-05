import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import {
  quickAuthTest,
  runExternalWalletAuthTest,
  runBatchAuthTests,
  testWithExistingWallet,
  generateTestWalletsForLater,
  runStressTest,
  AuthTestResult,
} from '../../utils/authTestRunner';
import {
  generateTestWallet,
  listTestWallets,
  getWalletInfo,
  validatePrivateKey,
} from '../../utils/walletTestUtils';
import {
  demoCompleteWorkflow,
  printUsageInstructions,
} from '../../utils/authTestDemo';

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'success' | 'error' | 'idle';
  result?: any;
  error?: string;
  duration?: number;
}

export default function AuthTestingScreen() {
  const authHook = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { id: 'quick', name: 'Quick Auth Test', status: 'idle' },
    { id: 'single', name: 'Single Wallet Test', status: 'idle' },
    { id: 'batch', name: 'Batch Tests (3 wallets)', status: 'idle' },
    { id: 'existing', name: 'Existing Wallet Test', status: 'idle' },
    { id: 'generate', name: 'Generate Test Wallets', status: 'idle' },
    { id: 'stress', name: 'Stress Test (5 concurrent)', status: 'idle' },
    { id: 'workflow', name: 'Complete Demo Workflow', status: 'idle' },
  ]);

  const [logs, setLogs] = useState<string[]>([]);
  const [isAnyTestRunning, setIsAnyTestRunning] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const updateTestStatus = (testId: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testId: string) => {
    if (isAnyTestRunning) {
      Alert.alert('Test Running', 'Please wait for the current test to complete.');
      return;
    }

    setIsAnyTestRunning(true);
    updateTestStatus(testId, { status: 'running' });
    addLog(`🚀 Starting ${tests.find(t => t.id === testId)?.name}...`);

    const startTime = Date.now();

    try {
      let result: any;

      switch (testId) {
        case 'quick':
          result = await quickAuthTest(authHook);
          addLog(`✅ Quick test ${result ? 'PASSED' : 'FAILED'}`);
          break;

        case 'single':
          result = await runExternalWalletAuthTest(authHook, {
            walletName: 'test-single-wallet',
            saveWallet: true,
          });
          addLog(`✅ Single wallet test: ${result.success ? 'PASSED' : 'FAILED'}`);
          if (result.walletAddress) {
            addLog(`👛 Wallet: ${result.walletAddress}`);
          }
          break;

        case 'batch':
          result = await runBatchAuthTests(authHook, 3);
          const successful = result.filter((r: AuthTestResult) => r.success).length;
          addLog(`✅ Batch test: ${successful}/3 wallets succeeded`);
          break;

        case 'existing':
          // First generate a test wallet
          const testWallet = await generateTestWallet({
            name: 'existing-test',
            saveToStorage: true,
          });
          addLog(`🔑 Generated test wallet: ${testWallet.address}`);
          
          // Test with the generated wallet
          result = await testWithExistingWallet(
            authHook,
            testWallet.privateKey,
            'existing-wallet-test'
          );
          addLog(`✅ Existing wallet test: ${result.success ? 'PASSED' : 'FAILED'}`);
          break;

        case 'generate':
          result = await generateTestWalletsForLater(3);
          addLog(`✅ Generated ${result.length} test wallets`);
          result.forEach((wallet: any, index: number) => {
            const info = getWalletInfo(wallet);
            addLog(`  ${index + 1}. ${info.shortAddress}`);
          });
          
          // List all saved wallets
          const savedWallets = await listTestWallets();
          addLog(`💾 Total saved wallets: ${savedWallets.length}`);
          break;

        case 'stress':
          result = await runStressTest(authHook, {
            testCount: 5,
            concurrentTests: 2,
            delayBetweenTests: 500,
          });
          const stressSuccessful = result.filter((r: AuthTestResult) => r.success).length;
          addLog(`✅ Stress test: ${stressSuccessful}/5 tests succeeded`);
          break;

        case 'workflow':
          // Run the complete demo workflow
          addLog(`🎬 Running complete demo workflow...`);
          await demoCompleteWorkflow(authHook);
          result = { completed: true };
          addLog(`✅ Complete workflow finished`);
          break;

        default:
          throw new Error(`Unknown test: ${testId}`);
      }

      const duration = Date.now() - startTime;
      updateTestStatus(testId, {
        status: 'success',
        result,
        duration,
      });
      addLog(`⏱️  Test completed in ${duration}ms`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus(testId, {
        status: 'error',
        error: error.message,
        duration,
      });
      addLog(`❌ Test failed: ${error.message}`);
    } finally {
      setIsAnyTestRunning(false);
      addLog(`---`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs cleared');
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'idle' as const })));
    addLog('🔄 Tests reset');
  };

  const showUsageInstructions = () => {
    addLog('📚 Usage instructions printed to console');
    printUsageInstructions();
    Alert.alert(
      'Usage Instructions',
      'Check the console logs for detailed usage instructions and example code.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Auth Testing Lab</Text>
          <Text style={styles.subtitle}>
            Test the Interspace authentication system
          </Text>
        </View>

        {/* Current Auth Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Auth Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Authenticated:</Text>
            <Text style={[
              styles.statusValue,
              { color: authHook.isAuthenticated ? Colors.dark.success : Colors.dark.error }
            ]}>
              {authHook.isAuthenticated ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          {authHook.user && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Wallet:</Text>
              <Text style={styles.statusValue}>
                {authHook.user.walletAddress?.slice(0, 6)}...{authHook.user.walletAddress?.slice(-4)}
              </Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text style={styles.statusValue}>
              {authHook.isLoading ? '🔄 Yes' : '✅ No'}
            </Text>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.testsSection}>
          <Text style={styles.sectionTitle}>Available Tests</Text>
          
          {tests.map((test) => (
            <TestButton
              key={test.id}
              test={test}
              onPress={() => runTest(test.id)}
              disabled={isAnyTestRunning}
            />
          ))}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionTitle}>Controls</Text>
          
          <View style={styles.controlsGrid}>
            <ControlButton
              title="📚 Usage Guide"
              description="Show usage instructions"
              onPress={showUsageInstructions}
              disabled={isAnyTestRunning}
            />
            
            <ControlButton
              title="🧹 Clear Logs"
              description="Clear test logs"
              onPress={clearLogs}
              disabled={isAnyTestRunning}
            />
            
            <ControlButton
              title="🔄 Reset Tests"
              description="Reset all test statuses"
              onPress={resetTests}
              disabled={isAnyTestRunning}
            />
          </View>
        </View>

        {/* Logs */}
        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle}>Test Logs</Text>
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.logsEmpty}>
                No logs yet. Run a test to see output here.
              </Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logEntry}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface TestButtonProps {
  test: TestResult;
  onPress: () => void;
  disabled: boolean;
}

function TestButton({ test, onPress, disabled }: TestButtonProps) {
  const getStatusIcon = () => {
    switch (test.status) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const getStatusColor = () => {
    switch (test.status) {
      case 'success': return Colors.dark.success;
      case 'error': return Colors.dark.error;
      case 'running': return Colors.dark.warning;
      default: return Colors.dark.text;
    }
  };

  return (
    <View 
      style={[
        styles.testButton,
        disabled && styles.testButtonDisabled,
        test.status === 'running' && styles.testButtonRunning,
      ]}
      onTouchEnd={disabled ? undefined : onPress}
    >
      <View style={styles.testButtonContent}>
        <View style={styles.testButtonLeft}>
          <Text style={styles.testButtonIcon}>{getStatusIcon()}</Text>
          <View style={styles.testButtonTextContainer}>
            <Text style={[
              styles.testButtonTitle,
              disabled && styles.testButtonTitleDisabled
            ]}>
              {test.name}
            </Text>
            {test.duration && (
              <Text style={styles.testButtonDuration}>
                {test.duration}ms
              </Text>
            )}
          </View>
        </View>
        
        {test.status === 'running' && (
          <ActivityIndicator size="small" color={Colors.dark.warning} />
        )}
      </View>
      
      {test.error && (
        <Text style={styles.testButtonError}>
          Error: {test.error}
        </Text>
      )}
    </View>
  );
}

interface ControlButtonProps {
  title: string;
  description: string;
  onPress: () => void;
  disabled: boolean;
}

function ControlButton({ title, description, onPress, disabled }: ControlButtonProps) {
  return (
    <View 
      style={[
        styles.controlButton,
        disabled && styles.controlButtonDisabled,
      ]}
      onTouchEnd={disabled ? undefined : onPress}
    >
      <Text style={[
        styles.controlButtonTitle,
        disabled && styles.controlButtonTitleDisabled
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.controlButtonDescription,
        disabled && styles.controlButtonDescriptionDisabled
      ]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    textAlign: 'center',
  },
  statusCard: {
    margin: 24,
    marginTop: 0,
    padding: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  testsSection: {
    margin: 24,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonRunning: {
    borderColor: Colors.dark.warning,
  },
  testButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  testButtonTextContainer: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  testButtonTitleDisabled: {
    color: Colors.dark.subtext,
  },
  testButtonDuration: {
    fontSize: 12,
    color: Colors.dark.subtext,
    marginTop: 2,
  },
  testButtonError: {
    fontSize: 12,
    color: Colors.dark.error,
    marginTop: 8,
  },
  controlsSection: {
    margin: 24,
    marginTop: 0,
  },
  controlsGrid: {
    gap: 12,
  },
  controlButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  controlButtonDisabled: {
    opacity: 0.6,
  },
  controlButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  controlButtonTitleDisabled: {
    color: Colors.dark.subtext,
  },
  controlButtonDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  controlButtonDescriptionDisabled: {
    color: Colors.dark.icon,
  },
  logsSection: {
    margin: 24,
    marginTop: 0,
    marginBottom: 40,
  },
  logsContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: 300,
  },
  logsEmpty: {
    fontSize: 14,
    color: Colors.dark.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  logEntry: {
    fontSize: 12,
    color: Colors.dark.text,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
});
