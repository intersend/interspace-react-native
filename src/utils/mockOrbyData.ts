import { IntentResponse, TransactionSummary, GasEstimate } from '../types/orby';
import { LinkedAccount } from '../types';

export const generateMockIntent = (type: 'send' | 'swap' = 'send'): IntentResponse => {
  const mockGasEstimate: GasEstimate = {
    totalUsd: '0.50',
    breakdown: [{
      chainId: 1,
      chainName: 'Ethereum',
      gasLimit: '21000',
      gasPrice: '20000000000',
      totalCost: '420000000000000',
      totalCostUsd: '0.50',
    }],
    paymentToken: {
      symbol: type === 'send' ? 'USDC' : 'ETH',
      amount: type === 'send' ? '500000' : '420000000000000',
      chainId: 1,
    },
  };

  const baseIntent = {
    intentId: `test_intent_${Date.now()}`,
    operationSetId: `test_op_${Date.now()}`,
    estimatedTimeMs: 30000,
    gasEstimate: mockGasEstimate,
    unsignedOperations: {
      operations: [
        {
          index: 0,
          chainId: 1,
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fA5e',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fA5e',
          value: '0',
          data: '0x',
          gasLimit: '21000',
          maxFeePerGas: '20000000000',
          maxPriorityFeePerGas: '1500000000',
          nonce: 42,
          type: 'eip1559' as const,
        }
      ],
      expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes
    }
  };

  if (type === 'send') {
    return {
      ...baseIntent,
      summary: {
        from: {
          chainName: 'Ethereum',
          token: 'USDC',
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          amount: '100000000', // 100 USDC
        },
        to: {
          address: 'alice.eth',
        },
        gasToken: 'USDC',
      },
    };
  } else {
    return {
      ...baseIntent,
      summary: {
        from: {
          chainName: 'Ethereum',
          token: 'ETH',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          amount: '100000000000000000', // 0.1 ETH
        },
        to: {
          chainName: 'Polygon',
          token: 'USDC',
          amount: '264500000', // 264.50 USDC
        },
        gasToken: 'ETH',
      },
    };
  }
};

export const generateMockLinkedAccount = (): LinkedAccount => {
  const wallets: Array<{ walletType: 'metamask' | 'coinbase' | 'walletconnect', customName: string }> = [
    { walletType: 'metamask', customName: 'MetaMask Wallet' },
    { walletType: 'coinbase', customName: 'Coinbase Wallet' },
    { walletType: 'walletconnect', customName: 'WalletConnect' },
  ];

  const selected = wallets[Math.floor(Math.random() * wallets.length)];

  return {
    id: `account_${Date.now()}`,
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fA5e',
    walletType: selected.walletType,
    customName: selected.customName,
    isPrimary: true,
    chainId: 1,
    metadata: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const getRandomTransactionScenario = () => {
  const scenarios = [
    {
      type: 'send' as const,
      intent: generateMockIntent('send'),
      account: generateMockLinkedAccount(),
      description: 'Send 100 USDC to alice.eth',
    },
    {
      type: 'swap' as const,
      intent: generateMockIntent('swap'),
      account: generateMockLinkedAccount(),
      description: 'Swap 0.1 ETH for 264.50 USDC',
    },
    {
      type: 'send' as const,
      intent: {
        ...generateMockIntent('send'),
        summary: {
          ...generateMockIntent('send').summary,
          from: {
            chainName: 'Polygon',
            token: 'MATIC',
            tokenAddress: '0x0000000000000000000000000000000000001010',
            amount: '5000000000000000000', // 5 MATIC
          },
          gasToken: 'MATIC',
        },
      },
      account: generateMockLinkedAccount(),
      description: 'Send 5 MATIC on Polygon',
    },
  ];

  return scenarios[Math.floor(Math.random() * scenarios.length)];
};
