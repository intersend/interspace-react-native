# Social Accounts Persistence Fix

## Issue

When the app is reloaded, linked social accounts (like Telegram) disappear from profiles even though they should persist. The accounts are properly linked to the profile's guest wallet but not displayed after reload.

## Root Cause

1. **Missing Wallet Reconnection**: On app startup, we authenticate the user but don't reconnect to the active profile's guest wallet
2. **Wallet Context Loss**: Without the wallet connection, the app can't retrieve the linked social profiles
3. **Display Logic**: The UI relies on the connected session wallet to show social accounts

## Solution Implemented

### 1. Authentication Initialization Enhancement

Updated `AuthContext.tsx` to reconnect to the active profile's wallet after session validation:

```typescript
// In initializeAuth() after session validation
try {
  console.log('🔄 Reconnecting to active profile wallet...');
  const profiles = await apiService.getProfiles();
  const activeProfile = profiles.find(p => p.isActive);
  
  if (activeProfile) {
    await connectToProfileWallet(activeProfile.id);
    console.log('✅ Reconnected to active profile wallet');
  }
} catch (walletError) {
  console.warn('⚠️ Failed to reconnect to profile wallet:', walletError);
}
```

### 2. Profile Wallet Context

Created `ProfileWalletContext.tsx` to manage wallet instances:
- Maintains wallet instances per profile
- Properly disconnects/connects when switching
- Uses `useSetActiveSessionWallet()` for proper integration

### 3. Wallet Isolation Architecture

Each profile has its own guest wallet with isolated storage:
- Storage prefix: `profile_${profileId}_`
- Wallet instances cached in memory
- Social accounts linked to specific profile wallets

## Testing Steps

1. **Initial Setup**:
   - Sign up with EOA
   - Link Telegram to Profile 1
   - Verify Telegram appears in the profile

2. **Persistence Test**:
   - Reload the app (Cmd+R in Expo)
   - Check if Telegram still appears in Profile 1

3. **Profile Switching Test**:
   - Create Profile 2
   - Switch to Profile 2
   - Verify Telegram is NOT in Profile 2
   - Switch back to Profile 1
   - Verify Telegram is still there

## Key Components

1. **AuthContext**: Handles initial wallet reconnection
2. **ProfileWalletContext**: Manages wallet instances
3. **useProfiles**: Uses ProfileWalletContext for switching
4. **useSocialProfiles**: Reads social accounts from active wallet

## Architecture Flow

```
App Start
├── AuthContext.initializeAuth()
│   ├── Validate session
│   ├── Restore user state
│   └── Reconnect to active profile wallet
│
├── ProfileWalletProvider
│   └── Manages wallet instances
│
└── Profile Display
    ├── useProfiles() - Gets profile data
    └── useSocialProfiles() - Gets social accounts from wallet
```

## Telegram Login Support

Added Telegram as a login option in `CleanAuthScreen.tsx`:
- Added to SOCIAL_PROVIDERS array
- Updated TypeScript types to include 'telegram' strategy
- Telegram icon: ✈️

## Important Notes

1. **Storage Isolation**: Each profile's wallet uses unique storage keys
2. **No Backend Storage**: Social profiles are stored in the session wallet provider, not backend
3. **Wallet Connection Required**: Social accounts only visible when wallet connected
4. **Profile Switching**: Properly disconnects old wallet before connecting new one
