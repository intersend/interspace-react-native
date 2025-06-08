import React, { createContext, useContext, ReactNode } from 'react';
import {
  useECDSAKeyGen,
  useGenECDSASign,
  useECDSAKeyRefresh,
} from '@silencelaboratories/react-native-duo-sdk';

interface SessionWalletContextValue {
  generateKey: ReturnType<typeof useECDSAKeyGen>['generateKey'];
  sign: ReturnType<typeof useGenECDSASign>['sign'];
  refreshKey: ReturnType<typeof useECDSAKeyRefresh>['refreshKey'];
  address?: string;
}

const SessionWalletContext = createContext<SessionWalletContextValue | null>(null);

interface Props {
  children: ReactNode;
}

export function SessionWalletProvider({ children }: Props) {
  const { generateKey, keyPair } = useECDSAKeyGen();
  const { sign } = useGenECDSASign();
  const { refreshKey } = useECDSAKeyRefresh();

  return (
    <SessionWalletContext.Provider
      value={{ generateKey, sign, refreshKey, address: keyPair?.address }}
    >
      {children}
    </SessionWalletContext.Provider>
  );
}

export function useSessionWallet() {
  const ctx = useContext(SessionWalletContext);
  if (!ctx) {
    throw new Error('useSessionWallet must be used within a SessionWalletProvider');
  }
  return ctx;
}
