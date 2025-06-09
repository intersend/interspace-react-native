import React, { createContext, useContext, ReactNode } from 'react';
import {
  useECDSAKeyGen,
  useGenECDSASign,
  useECDSAKeyRefresh,
} from '@silencelaboratories/react-native-duo-sdk';

interface SessionWalletContextValue {
  generateDeviceShare: ReturnType<typeof useECDSAKeyGen>['generateKey'];
  signMessage: ReturnType<typeof useGenECDSASign>['sign'];
  rotateKey: ReturnType<typeof useECDSAKeyRefresh>['refreshKey'];
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
      value={{
        generateDeviceShare: generateKey,
        signMessage: sign,
        rotateKey: refreshKey,
        address: keyPair?.address,
      }}
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

export function useGenerateDeviceShare() {
  const { generateDeviceShare } = useSessionWallet();
  return generateDeviceShare;
}

export function useSignMessage() {
  const { signMessage } = useSessionWallet();
  return signMessage;
}

export function useRotateKey() {
  const { rotateKey } = useSessionWallet();
  return rotateKey;
}
