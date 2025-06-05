import {
  UnifiedBalance,
  TransactionIntent,
  IntentResponse,
  SignedOperation,
  OperationStatus,
  SubmitOperationsRequest,
} from '../types/orby';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

class OrbyService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper to make authenticated requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { default: apiService } = await import('./api');
    // Use the private method through property access
    const response: ApiResponse<T> = await (apiService as any).requestWithRefresh(endpoint, options);
    return response.data;
  }

  // Get unified balance across all chains for a profile
  async getUnifiedBalance(profileId: string): Promise<UnifiedBalance> {
    try {
      const response = await this.makeRequest<any>(`/profiles/${profileId}/balance`);
      
      // Map backend response to frontend structure
      const mapped: UnifiedBalance = {
        totalUsdValue: response.unifiedBalance.totalUsdValue,
        tokens: response.unifiedBalance.tokens,
        gasAnalysis: {
          suggestedGasToken: {
            symbol: response.gasAnalysis.suggestedGasToken.symbol,
            chainId: response.gasAnalysis.suggestedGasToken.availableChains?.[0] || 1,
            score: response.gasAnalysis.suggestedGasToken.score,
            estimatedCost: '0.50', // Default estimate
          },
          nativeGasAvailable: response.gasAnalysis.nativeGasAvailable.map((gas: any) => ({
            chainId: gas.chainId,
            chainName: this.getChainName(gas.chainId),
            amount: gas.amount,
            symbol: gas.symbol,
            isEnoughForTx: parseFloat(gas.amount) > 0,
          })),
          alternativeGasTokens: response.gasAnalysis.availableGasTokens?.map((token: any) => ({
            symbol: token.symbol,
            chainId: token.availableChains?.[0] || 1,
            available: parseFloat(token.totalBalance) > 0,
            estimatedCost: '0.50', // Default estimate
          })),
        },
      };
      
      return mapped;
    } catch (error) {
      console.error('Failed to get unified balance:', error);
      throw error;
    }
  }

  // Helper to get chain name from ID
  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      10: 'Optimism',
      56: 'BNB Chain',
      137: 'Polygon',
      146: 'Sonic',
      8453: 'Base',
      42161: 'Arbitrum',
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  // Create a transaction intent
  async createTransactionIntent(
    profileId: string,
    intent: TransactionIntent
  ): Promise<IntentResponse> {
    try {
      return await this.makeRequest<IntentResponse>(
        `/profiles/${profileId}/intent`,
        {
          method: 'POST',
          body: JSON.stringify(intent),
        }
      );
    } catch (error) {
      console.error('Failed to create transaction intent:', error);
      throw error;
    }
  }

  // Submit signed operations
  async submitSignedOperations(
    operationSetId: string,
    signedOperations: SignedOperation[]
  ): Promise<void> {
    try {
      const request: SubmitOperationsRequest = { signedOperations };
      await this.makeRequest(
        `/operations/${operationSetId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      console.error('Failed to submit signed operations:', error);
      throw error;
    }
  }

  // Get operation status
  async getOperationStatus(operationSetId: string): Promise<OperationStatus> {
    try {
      return await this.makeRequest<OperationStatus>(
        `/operations/${operationSetId}/status`
      );
    } catch (error) {
      console.error('Failed to get operation status:', error);
      throw error;
    }
  }

  // Helper to poll operation status until completion
  async pollOperationStatus(
    operationSetId: string,
    onUpdate?: (status: OperationStatus) => void,
    pollInterval = 2000,
    maxAttempts = 60
  ): Promise<OperationStatus> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getOperationStatus(operationSetId);
      
      if (onUpdate) {
        onUpdate(status);
      }
      
      if (status.status === 'successful' || status.status === 'failed') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
    
    throw new Error('Operation polling timeout');
  }

  // Get gas token options for a profile
  async getGasTokenOptions(profileId: string): Promise<{
    suggestedToken: string;
    availableTokens: Array<{
      symbol: string;
      chainId: number;
      balance: string;
      estimatedCost: string;
    }>;
  }> {
    try {
      const balance = await this.getUnifiedBalance(profileId);
      const { gasAnalysis } = balance;
      
      const availableTokens = [
        {
          symbol: gasAnalysis.suggestedGasToken.symbol,
          chainId: gasAnalysis.suggestedGasToken.chainId,
          balance: this.getTokenBalance(balance, gasAnalysis.suggestedGasToken.symbol),
          estimatedCost: gasAnalysis.suggestedGasToken.estimatedCost,
        },
        ...(gasAnalysis.alternativeGasTokens || [])
          .filter(token => token.available)
          .map(token => ({
            symbol: token.symbol,
            chainId: token.chainId,
            balance: this.getTokenBalance(balance, token.symbol),
            estimatedCost: token.estimatedCost,
          })),
      ];
      
      return {
        suggestedToken: gasAnalysis.suggestedGasToken.symbol,
        availableTokens,
      };
    } catch (error) {
      console.error('Failed to get gas token options:', error);
      throw error;
    }
  }

  // Helper to get token balance from unified balance
  private getTokenBalance(balance: UnifiedBalance, symbol: string): string {
    const token = balance.tokens.find(t => t.symbol === symbol);
    return token ? token.totalAmount : '0';
  }

  // Format transaction for display
  formatTransactionSummary(intent: IntentResponse): {
    title: string;
    subtitle: string;
    amount: string;
    token: string;
    recipient?: string;
    estimatedTime: string;
    gasInfo: string;
  } {
    const { summary, gasEstimate, estimatedTimeMs } = intent;
    
    let title = 'Transaction';
    let subtitle = '';
    
    if (summary.to.address) {
      title = 'Send';
      subtitle = `To ${this.formatAddress(summary.to.address)}`;
    } else if (summary.to.token) {
      title = 'Swap';
      subtitle = `${summary.from.token} → ${summary.to.token}`;
    }
    
    const estimatedMinutes = Math.ceil(estimatedTimeMs / 60000);
    const estimatedTime = estimatedMinutes === 1 ? '~1 min' : `~${estimatedMinutes} mins`;
    
    return {
      title,
      subtitle,
      amount: summary.from.amount,
      token: summary.from.token,
      recipient: summary.to.address,
      estimatedTime,
      gasInfo: `Gas: ~$${gasEstimate.totalUsd} (paid in ${gasEstimate.paymentToken.symbol})`,
    };
  }

  // Format address for display
  private formatAddress(address: string): string {
    if (address.endsWith('.eth')) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Check if user has sufficient balance for transaction
  async checkSufficientBalance(
    profileId: string,
    tokenSymbol: string,
    amount: string,
    includeGas = true
  ): Promise<{
    sufficient: boolean;
    available: string;
    required: string;
    deficit?: string;
  }> {
    try {
      const balance = await this.getUnifiedBalance(profileId);
      const token = balance.tokens.find(t => t.symbol === tokenSymbol);
      
      if (!token) {
        return {
          sufficient: false,
          available: '0',
          required: amount,
          deficit: amount,
        };
      }
      
      const available = BigInt(token.totalAmount);
      let required = BigInt(amount);
      
      // Add estimated gas if paying with the same token
      if (includeGas && balance.gasAnalysis.suggestedGasToken.symbol === tokenSymbol) {
        const gasAmount = this.parseGasAmount(balance.gasAnalysis.suggestedGasToken.estimatedCost);
        required += gasAmount;
      }
      
      const sufficient = available >= required;
      const deficit = sufficient ? undefined : (required - available).toString();
      
      return {
        sufficient,
        available: available.toString(),
        required: required.toString(),
        deficit,
      };
    } catch (error) {
      console.error('Failed to check balance:', error);
      throw error;
    }
  }

  // Parse USD gas amount to token amount (simplified - real implementation would use price feeds)
  private parseGasAmount(usdAmount: string): bigint {
    // This is a simplified implementation
    // Real implementation would convert USD to token amount using price feeds
    const usd = parseFloat(usdAmount);
    const estimatedTokenAmount = usd * 1e6; // Assuming 1:1 for stablecoins
    return BigInt(Math.floor(estimatedTokenAmount));
  }
}

export const orbyService = new OrbyService();
export default orbyService;
