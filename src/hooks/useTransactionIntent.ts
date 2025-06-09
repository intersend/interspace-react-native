import { useState, useCallback } from 'react';
import { useProfiles } from './useProfiles';
import { useSignMessage } from '../contexts/SessionWalletContext';
import { useLinkedAccounts } from './useLinkedAccounts';
import { orbyService } from '../services/orby';
import {
  TransactionIntent,
  IntentResponse,
  SignedOperation,
  OperationStatus,
  UnifiedToken,
} from '../types/orby';

interface UseTransactionIntentReturn {
  // Intent creation
  createIntent: (params: {
    type: 'transfer' | 'swap';
    amount: string;
    token: UnifiedToken;
    recipient?: string;
    toToken?: UnifiedToken;
    toChainId?: number;
  }) => Promise<IntentResponse>;
  
  // Signing and submission
  signAndSubmit: (intent: IntentResponse) => Promise<string>;
  
  // Status tracking
  trackOperation: (operationSetId: string) => Promise<OperationStatus>;
  
  // State
  isCreatingIntent: boolean;
  isSigning: boolean;
  isSubmitting: boolean;
  currentIntent: IntentResponse | null;
  error: string | null;
  
  // Helpers
  reset: () => void;
}

export function useTransactionIntent(): UseTransactionIntentReturn {
  const { activeProfile } = useProfiles();
  const { accounts: linkedAccounts } = useLinkedAccounts(activeProfile?.id);
  const signMessage = useSignMessage();
  const activeLinkedAccount =
    linkedAccounts.find((acc) => acc.isPrimary) || linkedAccounts[0];
  const activeAccountAddress =
    activeLinkedAccount?.address || activeProfile?.sessionWalletAddress;
  
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<IntentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createIntent = useCallback(
    async (params: {
      type: 'transfer' | 'swap';
      amount: string;
      token: UnifiedToken;
      recipient?: string;
      toToken?: UnifiedToken;
      toChainId?: number;
    }): Promise<IntentResponse> => {
      if (!activeProfile?.id) {
        throw new Error('No active profile');
      }

      setIsCreatingIntent(true);
      setError(null);

      try {
        // Convert amount to raw value based on decimals
        const rawAmount = BigInt(parseFloat(params.amount) * Math.pow(10, params.token.decimals)).toString();

        // Build transaction intent
        const intent: TransactionIntent = {
          type: params.type,
          from: {
            token: params.token.balancesPerChain[0].tokenAddress,
            chainId: params.token.balancesPerChain[0].chainId,
            amount: rawAmount,
          },
          to: {},
        };

        // Add recipient for transfers
        if (params.type === 'transfer' && params.recipient) {
          intent.to.address = params.recipient;
        }

        // Add target token for swaps
        if (params.type === 'swap' && params.toToken) {
          intent.to.token = params.toToken.balancesPerChain[0].tokenAddress;
          intent.to.chainId = params.toChainId || params.toToken.balancesPerChain[0].chainId;
        }

        const response = await orbyService.createTransactionIntent(activeProfile.id, intent);
        setCurrentIntent(response);
        return response;
      } catch (err: any) {
        const message = err.message || 'Failed to create transaction intent';
        setError(message);
        throw new Error(message);
      } finally {
        setIsCreatingIntent(false);
      }
    },
    [activeProfile?.id]
  );

  const signAndSubmit = useCallback(
    async (intent: IntentResponse): Promise<string> => {
      if (!activeAccountAddress) {
        throw new Error('No active linked account or session wallet');
      }

      setIsSigning(true);
      setError(null);

      try {
        // Sign operations with session wallet
        const signedOperations: SignedOperation[] = [];

        for (const operation of intent.unsignedOperations.operations) {
          const signature = await signMessage(operation.data);
          signedOperations.push({ index: operation.index, signature });
        }

        setIsSigning(false);
        setIsSubmitting(true);

        // Submit signed operations
        await orbyService.submitSignedOperations(intent.operationSetId, signedOperations);

        return intent.operationSetId;
      } catch (err: any) {
        const message = err.message || 'Failed to sign and submit transaction';
        setError(message);
        throw new Error(message);
      } finally {
        setIsSigning(false);
        setIsSubmitting(false);
      }
    },
    [activeAccountAddress, signMessage]
  );

  const trackOperation = useCallback(
    async (operationSetId: string): Promise<OperationStatus> => {
      try {
        const status = await orbyService.pollOperationStatus(
          operationSetId,
          (update) => {
            console.log('Operation status update:', update);
          }
        );
        return status;
      } catch (err: any) {
        const message = err.message || 'Failed to track operation';
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsCreatingIntent(false);
    setIsSigning(false);
    setIsSubmitting(false);
    setCurrentIntent(null);
    setError(null);
  }, []);

  return {
    createIntent,
    signAndSubmit,
    trackOperation,
    isCreatingIntent,
    isSigning,
    isSubmitting,
    currentIntent,
    error,
    reset,
  };
}
