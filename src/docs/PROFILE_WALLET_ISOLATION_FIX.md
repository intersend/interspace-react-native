# Profile Wallet Isolation Fix

## Issue

When switching from Profile 1 (with Telegram linked) to Profile 2, the Telegram account was moving to Profile 2 instead of staying with Profile 1. This was a critical isolation failure.

## Root Cause

The issue was that we weren't properly managing wallet instances when switching profiles. The system maintains a single active session wallet context, and we were not:
1. Disconnecting the current wallet properly
2. Creating unique wallet instances per profile
3. Using `useSetActiveWallet()` to switch wallet contexts

## Solution Implemented

### 1. Created ProfileWalletContext

A dedicated context to manage profile-specific wallet instances:

```typescript
// src/contexts/ProfileWalletContext.tsx
export function ProfileWalletProvider({ children }: ProfileWalletProviderProps) {
  const setActiveWallet = useSetActiveSessionWallet();
  const activeWallet = useActiveSessionWallet();
  const { disconnect } = useDisconnect();
  
  // Keep track of wallet instances per profile
  const profileWallets = useRef<Map<string, Wallet>>(new Map());
```

### 2. Profile-Scoped Storage

Each profile gets its own storage namespace:

```typescript
const profileStoragePrefix = `profile_${profileId}_`;
const profileScopedStorage = {
  getItem: async (key: string) => {
    return AsyncStorage.getItem(profileStoragePrefix + key);
  },
  setItem: async (key: string, value: string) => {
    return AsyncStorage.setItem(profileStoragePrefix + key, value);
  },
  removeItem: async (key: string) => {
    return AsyncStorage.removeItem(profileStoragePrefix + key);
  },
};
```

### 3. Proper Wallet Switching

When switching profiles:

```typescript
const switchProfileWallet = async (profileId: string) => {
  // 1. Disconnect current wallet
  if (activeWallet) {
    await disconnect(activeWallet);
  }
  
  // 2. Get or create wallet instance for the profile
  let profileWallet = profileWallets.current.get(profileId);
  if (!profileWallet) {
    profileWallet = sessionWallet({
      storage: profileScopedStorage,
    });
    profileWallets.current.set(profileId, profileWallet);
  }
  
  // 3. Connect to the profile's wallet
  await profileWallet.connect({
    client,
    strategy: 'guest',
  });
  
  // 4. CRITICAL: Set as active wallet
  await setActiveWallet(profileWallet);
}; 
```

### 4. Provider Hierarchy

Updated the app layout to include ProfileWalletProvider:

```typescript
// app/_layout.tsx
return (
  <SessionWalletProvider>
    <ProfileWalletProvider>
      <AuthProvider>
        {/* ... */}
      </AuthProvider>
    </ProfileWalletProvider>
  </SessionWalletProvider>
);
```

## Key Points

1. **Wallet Instance Management**: Each profile maintains its own wallet instance
2. **Storage Isolation**: Each wallet uses profile-prefixed storage keys
3. **Proper Disconnection**: Always disconnect current wallet before switching
4. **Active Wallet Setting**: Use `setActiveWallet()` to properly switch contexts

## Testing

1. Create Profile 1 and link Telegram
2. Create Profile 2 and switch to it
3. Verify Telegram stays in Profile 1
4. Switch back to Profile 1 and verify Telegram is still there

## Benefits

- Complete isolation between profiles
- Social accounts stay with their respective profiles
- No cross-contamination of wallet data
- Proper session wallet integration
