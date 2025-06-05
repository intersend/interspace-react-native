// Orby Chain Abstraction Types

// Unified Balance Types
export interface UnifiedBalance {
  totalUsdValue: string;
  tokens: UnifiedToken[];
  gasAnalysis: GasAnalysis;
}

export interface UnifiedToken {
  symbol: string;
  name: string;
  totalAmount: string; // BigInt as string
  totalUsdValue: string;
  decimals: number;
  balancesPerChain: ChainBalance[];
}

export interface ChainBalance {
  chainId: number;
  chainName: string;
  amount: string; // BigInt as string
  tokenAddress: string;
  nativeToken?: boolean;
}

export interface GasAnalysis {
  suggestedGasToken: SuggestedGasToken;
  nativeGasAvailable: NativeGasBalance[];
  alternativeGasTokens?: GasToken[];
}

export interface SuggestedGasToken {
  symbol: string;
  chainId: number;
  score: number; // 0-100, higher is better
  estimatedCost: string; // USD value
}

export interface NativeGasBalance {
  chainId: number;
  chainName: string;
  amount: string; // BigInt as string
  symbol: string;
  isEnoughForTx: boolean;
}

export interface GasToken {
  symbol: string;
  chainId: number;
  available: boolean;
  estimatedCost: string;
}

// Transaction Intent Types
export interface TransactionIntent {
  type: 'transfer' | 'swap' | 'bridge' | 'app_interaction';
  from: {
    token?: string; // Token address (optional for native)
    chainId: number;
    amount: string; // BigInt as string
  };
  to: {
    address?: string; // Recipient for transfers
    token?: string; // Target token for swaps
    chainId?: number; // Target chain for bridges
  };
  gasToken?: {
    token?: string; // Gas token address (optional for native)
    chainId: number;
  };
  metadata?: {
    appUrl?: string;
    appName?: string;
    functionName?: string;
    [key: string]: any;
  };
}

export interface IntentResponse {
  intentId: string;
  operationSetId: string;
  estimatedTimeMs: number;
  unsignedOperations: UnsignedOperations;
  summary: TransactionSummary;
  gasEstimate: GasEstimate;
}

export interface UnsignedOperations {
  operations: UnsignedOperation[];
  expiresAt: string;
}

export interface UnsignedOperation {
  index: number;
  chainId: number;
  from: string;
  to: string;
  value: string;
  data: string;
  gasLimit?: string;
  nonce?: number;
  type: 'eip1559' | 'legacy' | 'eip2930';
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
}

export interface TransactionSummary {
  from: {
    token: string;
    amount: string;
    chainName: string;
    tokenAddress?: string;
  };
  to: {
    address?: string;
    token?: string;
    amount?: string;
    chainName?: string;
  };
  gasToken: string;
  route?: RouteStep[];
}

export interface RouteStep {
  action: 'transfer' | 'bridge' | 'swap' | 'approve';
  fromChain: string;
  toChain?: string;
  token: string;
  amount: string;
  protocol?: string;
}

export interface GasEstimate {
  totalUsd: string;
  breakdown: GasBreakdown[];
  paymentToken: {
    symbol: string;
    amount: string;
    chainId: number;
  };
}

export interface GasBreakdown {
  chainId: number;
  chainName: string;
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  totalCostUsd: string;
}

// Signed Operations Types
export interface SignedOperation {
  index: number;
  signature: string;
  signedData?: string; // For EIP-712 typed data
}

export interface SubmitOperationsRequest {
  signedOperations: SignedOperation[];
}

// Operation Status Types
export interface OperationStatus {
  operationSetId: string;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'partial';
  transactions: TransactionStatus[];
  error?: string;
  completedAt?: string;
}

export interface TransactionStatus {
  chainId: number;
  chainName: string;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  blockTimestamp?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  error?: string;
}

// UI State Types
export interface TransactionModalState {
  isVisible: boolean;
  step: 'input' | 'confirm' | 'signing' | 'processing' | 'success' | 'error';
  
  // Transaction data
  type: 'send' | 'swap' | 'app';
  amount: string;
  recipient?: string;
  selectedToken?: UnifiedToken;
  selectedFromChain?: number;
  selectedToChain?: number;
  
  // Orby data
  intent?: IntentResponse;
  operations?: UnsignedOperations;
  
  // Status
  operationSetId?: string;
  status?: OperationStatus;
  error?: string;
}

// WebSocket Types
export interface OperationUpdate {
  type: 'status_update' | 'transaction_update' | 'completion';
  operationSetId: string;
  data: OperationStatus | TransactionStatus | CompletionData;
}

export interface CompletionData {
  success: boolean;
  finalStatus: OperationStatus;
  balanceChanges?: BalanceChange[];
}

export interface BalanceChange {
  token: string;
  chainId: number;
  previousBalance: string;
  newBalance: string;
  change: string;
}
