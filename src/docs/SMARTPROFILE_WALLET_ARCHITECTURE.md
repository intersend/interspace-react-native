# SmartProfile Wallet Architecture - Implementation Complete

## Overview

We've successfully implemented a profile-specific wallet architecture where each SmartProfile owns a persistent guest wallet that serves as the container for all authentication methods and social accounts linked to that profile.

## Architecture

```
Interspace App
├── User Authentication Layer
│   └── Initial auth (EOA/Social/Email) → Creates/Retrieves User
│
├── SmartProfile Layer
│   ├── Profile 1: "Trading"
│   │   ├── Guest Wallet (0xABC...) [Isolated Storage]
│   │   ├── Linked EOAs: [MetaMask, Coinbase]
│   │   └── Social Profiles: [Discord, Telegram]
│   │
│   └── Profile 2: "Gaming"
│       ├── Guest Wallet (0xDEF...) [Isolated Storage]
│       ├── Linked EOAs: [Test Wallet]
│       └── Social Profiles: [Google, Apple]
│
└── Silence Labs Session Wallet (ERC-7702)
    └── Backend-managed proxy for transactions
```

## Key Components

### 1. Profile-Scoped Storage

Each profile's guest wallet uses isolated storage to prevent cross-contamination:

```typescript
const profileStoragePrefix = `profile_${profile.id}_`;
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

### 2. Profile Creation Flow

When a profile is created:
1. Backend creates the SmartProfile (ERC-7702 session wallet)
2. Frontend creates a persistent guest wallet with isolated storage
3. Wallet association is stored for future connections

### 3. Profile Switching

When switching profiles:
1. Disconnect current wallet
2. Connect to new profile's wallet using its unique storage
3. All linked social accounts automatically switch

### 4. Social Account Linking

Social accounts are now properly isolated per profile:
1. Link using the active profile's wallet context
2. Sync with backend using new API endpoints
3. Backend stores social profiles per SmartProfile

## Implementation Details

### API Endpoints Added

```typescript
// Get social profiles for a SmartProfile
GET /profiles/:profileId/social-profiles

// Delete a social profile
DELETE /profiles/:profileId/social-profiles/:socialProfileId

// Sync social profiles (existing, enhanced)
POST /profiles/:profileId/sync-social
```

### Key Files Modified

1. **src/services/api.ts**
   - Added `getSocialProfiles()` method
   - Added `deleteSocialProfile()` method
   - Enhanced `syncSocialProfiles()` method

2. **src/hooks/useProfiles.ts**
   - `createProfile()` now creates profile-scoped guest wallet
   - `switchToProfile()` connects to profile's wallet
   - Proper wallet lifecycle management

3. **src/contexts/AuthContext.tsx**
   - `createProfileWallet()` helper for new profiles
   - `connectToProfileWallet()` for profile switching
   - Profile wallet connection during authentication

4. **src/hooks/useSocialProfiles.ts**
   - `linkSocialProfile()` syncs with backend
   - Proper error handling for wallet context
   - Profile-specific social account management

## Benefits Achieved

1. **Complete Isolation**: Each profile's social accounts are isolated
2. **No Cross-Contamination**: Different users can't see each other's social accounts
3. **Persistent Wallets**: No more ephemeral wallets that cause issues
4. **Natural Architecture**: Leverages session wallet design patterns
5. **Backend Sync**: Social profiles properly stored per SmartProfile

## Usage Examples

### Creating a New Profile

```typescript
const { createProfile } = useProfiles();

// Creates profile with isolated guest wallet
const profile = await createProfile('Trading Profile');
```

### Switching Profiles

```typescript
const { switchToProfile } = useProfiles();

// Connects to profile's wallet automatically
await switchToProfile(profileId);
```

### Linking Social Accounts

```typescript
const { linkSocialProfile } = useSocialProfiles();

// Links to active profile and syncs with backend
await linkSocialProfile('discord');
```

## Security Considerations

1. **Storage Isolation**: Each profile uses unique storage keys
2. **Wallet Disconnection**: Proper cleanup when switching
3. **Backend Validation**: All operations validated server-side
4. **No Shared State**: Profiles can't access each other's data

## Future Enhancements

1. **Profile Export**: Allow users to export profile data
2. **Profile Sharing**: Share read-only profile views
3. **Multi-Device Sync**: Sync profiles across devices
4. **Advanced Permissions**: Granular control over linked accounts

## Migration Notes

For existing users:
- Profiles created before this update need wallet creation
- Social accounts linked to old system need migration
- Backend handles backward compatibility

## Testing Checklist

- [x] Create profile with guest wallet
- [x] Switch between profiles
- [x] Link social accounts to profiles
- [x] Verify isolation between profiles
- [x] Test with multiple users
- [x] Verify backend sync
