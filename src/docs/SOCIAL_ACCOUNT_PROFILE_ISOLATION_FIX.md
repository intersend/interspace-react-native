# Social Account Profile Isolation Fix

## Issues Fixed

### 1. Social Account Moving Between Profiles
**Problem**: When switching profiles, Telegram account appeared to move to the newly active profile.
**Root Cause**: UI was showing social accounts from the currently connected wallet instead of each profile's specific wallet.

### 2. Social Account Disappearing
**Problem**: After logging in with EOA, Telegram account disappeared from all profiles.
**Root Cause**: Login method conflict - different authentication methods weren't maintaining profile wallet associations.

## Architecture Changes

### 1. Social Wallet as Profile Wallet
When a user logs in with a social account (Telegram, Google, etc.), that wallet becomes the profile's session wallet:

```typescript
// In handleSmartProfileSetup
if (['google', 'apple', 'facebook', 'discord', 'telegram'].includes(strategy) && wallet) {
  // Use social wallet as profile wallet
  await createProfileWallet(defaultProfile, wallet, config.strategy);
}
```

### 2. Profile-Specific Social Account Display
Created `useProfileSocialAccounts` hook to fetch social accounts for each profile independently:

```typescript
// Shows the wallet strategy for each profile
if (['google', 'apple', 'facebook', 'discord', 'telegram'].includes(strategy)) {
  setSocialAccounts([{
    type: strategy,
    details: {
      strategy: strategy,
      displayName: strategy.charAt(0).toUpperCase() + strategy.slice(1),
    }
  }]);
}
```

### 3. Profile Wallet Context Updates
Enhanced wallet switching to properly handle different strategies:

```typescript
// In ProfileWalletContext
if (['google', 'apple', 'facebook', 'discord', 'telegram'].includes(strategy)) {
  // Social wallets auto-restore from storage
  await profileWallet.connect({ client });
} else {
  // Guest wallets reconnect with strategy
  await profileWallet.connect({ client, strategy: strategy as any });
}
```

## How It Works Now

### Profile Creation
1. **Social Login**: User logs in with Telegram
2. **Profile Creation**: System creates profile with Telegram wallet as session wallet
3. **Storage**: Wallet strategy stored with profile data

### Profile Display
1. Each profile card uses `useProfileSocialAccounts` hook
2. Hook reads profile's wallet data from storage
3. Shows appropriate social account based on wallet strategy

### Profile Switching
1. Disconnect current wallet
2. Read new profile's wallet data
3. Reconnect with appropriate strategy (social/guest)
4. Social accounts remain with their profiles

## Benefits

1. **True Isolation**: Social accounts permanently tied to profiles
2. **No Migration**: Social accounts can't move between profiles
3. **Clear Association**: Each profile shows its own authentication method
4. **Persistent State**: Social accounts survive app reloads and re-authentication

## Testing Scenarios

### Scenario 1: New User with Telegram
- Sign up with Telegram ✓
- Profile shows Telegram account ✓
- Reload app - Telegram still there ✓

### Scenario 2: Multiple Profiles
- Profile 1: Login with Telegram ✓
- Create Profile 2: Uses guest wallet ✓
- Switch between profiles - each maintains its accounts ✓

### Scenario 3: Mixed Authentication
- Login with Telegram initially ✓
- Add EOA to system ✓
- Login with EOA later ✓
- Telegram profile still shows Telegram ✓

## Technical Details

### Storage Structure
```json
{
  "profileId": "profile_123",
  "walletAddress": "0x...",
  "strategy": "telegram",  // or "guest", "google", etc.
  "storagePrefix": "profile_123_",
  "createdAt": "2024-..."
}
```

### Component Structure
```
ProfilesScreen
  └── ProfileCardWithSocial (for each profile)
       ├── useProfileSocialAccounts(profile.id)
       └── AppleWalletCard
            └── Displays profile-specific social accounts
```

## Future Considerations

1. **Backend Sync**: When backend implements social profile storage, update `useProfileSocialAccounts` to fetch from API
2. **Multi-Social**: Consider supporting multiple social accounts per profile
3. **Social Unlinking**: Add ability to unlink social accounts (would convert to guest wallet)
