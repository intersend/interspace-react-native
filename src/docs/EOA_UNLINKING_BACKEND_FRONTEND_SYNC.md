# EOA Unlinking - Backend & Frontend Sync

## Issue Summary

When an EOA is removed from all profiles, it should be completely disassociated from the user account and treated as a new user on next login.

## Backend Solution (✅ Implemented)

The backend team has implemented the following logic in `DELETE /accounts/:accountId`:

1. First performs a soft delete (sets `isActive = false`)
2. Checks if the EOA address is linked to any other active profiles for the same user
3. If no other active profiles exist, completely deletes the linkedAccount record
4. This ensures the EOA will be treated as a new user on next authentication

## Frontend Implementation

### Current State

The frontend properly calls the backend unlinking endpoint, which handles the complete removal.

### What's Working

1. **Backend Removal**: When an EOA is removed from the last profile, the backend completely removes it from the user account ✅
2. **Local State Update**: The frontend properly updates local state to remove the account ✅
3. **New User Flow**: When the removed EOA signs in again, it's treated as a new user ✅


## Testing Checklist

- [x] Backend completely removes EOA when unlinked from last profile
- [x] Removed EOA can sign in as new user
- [x] EOA linked to multiple profiles only gets removed from requested profile
- [x] Frontend properly updates UI after unlinking

## Future Enhancements

1. Consider adding a "Remove from all profiles" option for power users
2. Add audit logging for account removals
