# Telegram Authentication Backend Fix

## Issue

When attempting to login with Telegram, the backend returns a 401 error:
```
Social data required for social auth strategy
```

## Root Cause

The backend expects a `socialProfile` object when using social authentication strategies. The current implementation tries to extract this from the wallet object, but:

1. The wallet object may not provide user details for all social providers in the same way
2. The extraction logic might not find the data in the expected properties
3. For Telegram specifically, the user details might be stored differently

## Current Flow

```
1. User clicks "Continue with Telegram"
2. The app connects the in-app wallet with the Telegram strategy
3. We try to extract user details from wallet object
4. If no details found, we create a minimal profile
5. Backend rejects because it needs actual social data
```

## The Fix

We've updated the `connectInAppWallet` function to:

1. Try multiple methods to extract user details
2. Always pass a socialProfile for social strategies
3. Create a minimal profile if extraction fails
4. Add extensive logging to debug what the wallet library provides

## Debugging Output

The updated code logs:
- Wallet object keys
- Available methods on the wallet
- Raw user details from the wallet
- Final extracted profile

## Backend Requirements

The backend expects:
```typescript
socialProfile: {
  id: string;          // User's social ID
  email?: string;      // Email if available
  name?: string;       // Display name
  picture?: string;    // Profile picture URL
  username?: string;   // Username on the platform
  // ... other platform-specific fields
}
```

## Temporary Workaround

If the wallet does not provide Telegram user details, we create a minimal profile:
```typescript
socialProfile = {
  id: walletAddress,
  name: 'telegram',
  strategy: 'telegram'
}
```

## Backend Consideration

The backend should be updated to:
1. Handle minimal social profiles gracefully
2. Not require full social data for initial authentication
3. Allow users to complete their profile later

## Testing

1. Try Telegram login and check console logs
2. Look for "🔍 Wallet object keys" and "🔍 Raw telegram user details"
3. Check what data the wallet actually provides
4. Verify if socialProfile is being passed to backend

## Next Steps

1. Check the wallet provider documentation for Telegram integration
2. Contact the wallet provider if user details aren't available
3. Update backend to handle minimal profiles
4. Consider storing social profiles separately from authentication
