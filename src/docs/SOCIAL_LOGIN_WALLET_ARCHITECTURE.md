# Social Login Wallet Architecture

## Overview

When a user logs in with a social account (Telegram, Google, Discord, etc.), that social wallet becomes the profile's session wallet. This ensures social accounts are permanently associated with profiles.

## Previous Issue

- User logs in with Telegram
- System creates TWO wallets: social login wallet + profile guest wallet
- Attempts to "link" Telegram to the guest wallet fail
- Telegram account doesn't display in profile

## New Architecture

### First-time Social Login Flow

1. **User logs in with Telegram**
   - Creates in-app wallet with Telegram strategy
   - This wallet has the Telegram account linked

2. **Profile Creation**
   - Backend creates the SmartProfile (ERC-7702 proxy)
   - Frontend uses the Telegram wallet AS the profile's session wallet
   - No separate guest wallet is created

3. **Result**
   - Telegram is permanently part of the profile
   - Profile's session wallet = Telegram wallet
   - Telegram always displays when viewing this profile

### Returning User Flow

1. **User logs in with same Telegram**
   - Thirdweb recognizes the account
   - Returns the same wallet instance
   - Profile's wallet is restored with Telegram intact

### Profile Switching

1. **Each profile has its own wallet**
   - Profile 1: Telegram wallet
   - Profile 2: Guest wallet (or different social)
   - Profile 3: Discord wallet

2. **Switching profiles**
   - Disconnects current wallet
   - Connects to new profile's wallet
   - Social accounts stay with their profiles

## Implementation Details

### AuthContext Changes

```typescript
// In handleSmartProfileSetup
if (['google', 'apple', 'facebook', 'discord', 'telegram'].includes(config.strategy) && wallet) {
  // Use social wallet as profile wallet
  await createProfileWallet(defaultProfile, wallet, config.strategy);
} else {
  // Create guest wallet for non-social logins
  await createProfileWallet(defaultProfile);
}
```

### Profile Wallet Storage

```typescript
// Stored in AsyncStorage
{
  profileId: "profile_123",
  walletAddress: "0x...",
  strategy: "telegram", // or "guest", "google", etc
  storagePrefix: "profile_123_",
  createdAt: "2024-..."
}
```

## Benefits

1. **Permanent Association**: Social accounts can't "float" between profiles
2. **No Linking Required**: Social account is inherently part of the wallet
3. **Consistent State**: No risk of linking failures or state mismatches
4. **Profile Isolation**: Each profile maintains its own wallet and accounts

## Testing

1. **New User with Telegram**
   - Sign up with Telegram
   - Check profile shows Telegram
   - Reload app - Telegram still there

2. **Multiple Profiles**
   - Profile 1: Login with Telegram
   - Create Profile 2: Uses guest wallet
   - Switch between - each maintains its accounts

3. **Profile Persistence**
   - Login with social account
   - Close app completely
   - Reopen - social account persists
