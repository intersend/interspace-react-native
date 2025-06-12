# Google Sign-In Implementation Guide

## Overview

The Google Sign-In implementation has been updated to follow the official `@react-native-google-signin/google-signin` documentation patterns with proper error handling, configuration options, and response type checking.

## Key Changes

### 1. Enhanced Imports
```typescript
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
  isErrorWithCode,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
```

### 2. Comprehensive Configuration
```typescript
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  scopes: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: false,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  profileImageSize: 120,
});
```

### 3. Improved Error Handling
The implementation now properly handles different error scenarios:
- `IN_PROGRESS`: Sign-in already in progress
- `PLAY_SERVICES_NOT_AVAILABLE`: Android-specific error for missing/outdated Google Play Services
- User cancellation
- General errors

### 4. Response Type Checking
Uses proper type guards to check response types:
- `isSuccessResponse()` for successful sign-in
- `isCancelledResponse()` for user cancellation
- `isNoSavedCredentialFoundResponse()` for silent sign-in

### 5. Silent Sign-In Support
Automatically attempts to sign in users who have previously signed in:
```typescript
if (GoogleSignin.hasPreviousSignIn()) {
  const response = await GoogleSignin.signInSilently();
  if (response.type === 'success' && response.data.idToken) {
    // Auto-login with Google
  }
}
```

### 6. Sign-Out Integration
Properly signs out from Google when logging out:
```typescript
const currentUser = await GoogleSignin.getCurrentUser();
if (currentUser) {
  await GoogleSignin.signOut();
}
```

## Environment Variables

Add these to your `.env` file:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here (optional)
```

## Usage Example

```typescript
import { useAuth } from '../../contexts/AuthContext';

const { login, isLoading, error } = useAuth();

const handleGoogleSignIn = async () => {
  try {
    await login(
      { strategy: 'google' },
      () => {
        // Success callback
        console.log('Successfully signed in with Google!');
      }
    );
  } catch (err) {
    // Handle error
    console.error('Sign-in failed:', err.message);
  }
};
```

## Platform-Specific Setup

### iOS
1. Add your `GoogleService-Info.plist` to your iOS project
2. Configure URL schemes in your Info.plist
3. Set up OAuth 2.0 client ID in Google Cloud Console

### Android
1. Add your `google-services.json` to your Android project
2. Ensure Google Play Services are available
3. Configure SHA-1 fingerprint in Google Cloud Console

## Error Messages

The implementation provides clear error messages for different scenarios:
- "Google Sign-In is already in progress"
- "Google Play Services are not available or outdated"
- "Google Sign-In was cancelled"
- "No ID token received from Google Sign-In"

## Security Considerations

1. The `idToken` is used for backend authentication
2. Email is extracted from Google user data when available
3. Tokens are securely stored using React Native Keychain
4. Session management includes automatic token refresh

## Testing

To test the implementation:
1. Ensure you have valid Google OAuth credentials
2. Test on both iOS and Android devices
3. Test error scenarios (no internet, cancelled sign-in, etc.)
4. Verify silent sign-in works after initial authentication
