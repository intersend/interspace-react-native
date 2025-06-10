import React, { createContext, useContext, ReactNode } from 'react';

const disableSilenceLabs =
  process.env.EXPO_PUBLIC_DISABLE_SILENCELABS === 'true';

type AsyncFn = (...args: any[]) => Promise<any>;

interface ECDSAKeyGenHookReturn {
  generateKey: AsyncFn;
  keyPair?: { address?: string };
}

type ECDSAKeyGenHook = () => ECDSAKeyGenHookReturn;

interface GenECDSASignHookReturn {
  sign: AsyncFn;
}

type GenECDSASignHook = () => GenECDSASignHookReturn;

interface ECDSAKeyRefreshHookReturn {
  refreshKey: AsyncFn;
}

type ECDSAKeyRefreshHook = () => ECDSAKeyRefreshHookReturn;

let useECDSAKeyGen: ECDSAKeyGenHook;
let useGenECDSASign: GenECDSASignHook;
let useECDSAKeyRefresh: ECDSAKeyRefreshHook;

if (!disableSilenceLabs) {
  const sdk = require('@silencelaboratories/react-native-duo-sdk');
  useECDSAKeyGen = sdk.useECDSAKeyGen;
  useGenECDSASign = sdk.useGenECDSASign;
  useECDSAKeyRefresh = sdk.useECDSAKeyRefresh;
} else {
  useECDSAKeyGen = () => ({ generateKey: async () => {}, keyPair: undefined });
  useGenECDSASign = () => ({ sign: async () => '' });
  useECDSAKeyRefresh = () => ({ refreshKey: async () => {} });
}

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
