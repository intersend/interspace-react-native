# Social Account Auto-Linking Fix

## Issue

When logging in with a social account (e.g., Telegram), the social account was not automatically linked to the SmartProfile. Users would see "0 linked accounts" even though they logged in with a social account.

## Root Cause

The issue was a misunderstanding of the authentication flow:
1. **Login with social** creates an authentication wallet
2. **SmartProfile creation** creates a separate guest wallet
3. The social account stays with the auth wallet, not the profile wallet
4. No automatic linking was happening between the social account and the profile

## Solution Implemented

### 1. Detection in AuthContext

Added logic to detect social login and mark it for auto-linking:

```typescript
// In AuthContext.tsx after successful login
if (['google', 'apple', 'facebook', 'discord', 'telegram'].includes(config.strategy)) {
  await AsyncStorage.setItem('pending_social_link', JSON.stringify({
    strategy: config.strategy,
    timestamp: Date.now(),
  }));
}
```

### 2. Auto-Link Hook

Created `useAutoLinkSocial` hook that:
- Checks for pending social links after authentication
- Automatically links the social account to the active profile
- Expires after 5 minutes to prevent stale links
- Only runs once per session

```typescript
export function useAutoLinkSocial() {
  const { isAuthenticated } = useAuth();
  const { activeProfile } = useProfiles();
  const { linkSocialProfile, linkTelegramProfile } = useSocialProfiles();
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAndLinkPendingSocial = async () => {
      // Check for pending link and auto-link
    };
  }, [isAuthenticated, activeProfile?.id]);
}
```

### 3. Integration

The hook is used in the profiles screen to ensure auto-linking happens when the UI is ready:

```typescript
// In ProfilesScreen
useAutoLinkSocial();
```

## Flow

1. User logs in with Telegram
2. Auth wallet is created with Telegram linked
3. SmartProfile is created with guest wallet
4. Profile wallet is connected
5. Auto-link hook detects pending Telegram link
6. Telegram is automatically linked to the profile wallet
7. Telegram now appears in the profile

## Benefits

- Seamless user experience - social accounts automatically appear in profiles
- No manual linking required after login
- Works for all social providers (Google, Apple, Facebook, Discord, Telegram, etc.)
- Prevents confusion about missing social accounts

## Testing

1. Clear app data
2. Login with Telegram
3. Profile should be created
4. After 2-3 seconds, Telegram should appear in the profile
5. Reload app - Telegram should persist
