you are an expert product person and engineer.

we are working on this new project, react-native web3 wallet wrapper, and im hsaring details below:


Interspace MVP Wallet Project Description

Project Overview:
Interspace is a mobile-first crypto wallet built with React Native, designed to simplify Web3 app interactions and streamline the user experience through a structured approach with smartprofiles, app management, and intuitive wallet interactions.

its like a wallet wrapper. you bring your existing accounts, we wrap them with a 'session' wallet, and abstract token, gas, and chain as you use the apps.

Tech Stack:
	•	Frontend: React Native (fully custom UI)
	•	Backend / Wallet Infra: Thirdweb (React Hooks only, no built-in UI components)
	•	Authentication & Wallet Management: Thirdweb provider for EVM
	•	Wallet Proxy Standard: ERC-7702 proxy accounts for delegation and transaction handling.

⸻

Key Components & Navigation

The app includes three primary navigation tabs at the bottom:

1. Profiles

2. Apps

3. Wallet

⸻

1. Profiles

Profiles allow users to group their existing crypto accounts and wallets into distinct contexts or “smartprofiles,” such as Trading, Gaming, Payments, etc.

Smartprofiles:
	•	Each smartprofile has its own Session Wallet (ERC-7702 Proxy):
	•	Automatically created upon profile creation.
	•	Provides both an EVM-compatible address.
	•	Acts as the primary signer and delegate for transactions initiated from the profile.
	•	Users never directly deposit funds into the Session Wallet.
	•	Linked Accounts:
	•	Users link existing accounts such as MetaMask, Coinbase, or other EOAs.
	•	Users explicitly grant ERC-20 token allowances to the Session Wallet, enabling seamless and permissionless transactions initiated by the Session Wallet without repeated signing prompts.




2. Apps

The Apps screen functions like and mimics an iPhone-style home screen grid, displaying bookmarked apps as tappable icons.

for this react native app, i want ot have apple-native thigns like an home screen in the app with all the apps that are bookmarked, like iphone home screen, and i want people to be able to create folders, move the apps, delete, in the same way as apple.


UI & Navigation:
	•	Grid-based Layout:
Apps are displayed as icons in a grid, similar to iOS’s Home screen.
	•	Folders and Drag & Drop:
Users can enter edit mode (long press), create folders, drag-and-drop apps into folders, rearrange app positions, and delete bookmarks.
	•	Launching Apps:
Tapping an app icon opens it in the in-app browser. The active smartprofile’s Session Wallet is injected as the wallet provider.

In-app Browser (WebView):
	•	Custom Browser Bar:
Users can enter URLs manually, similar to a traditional browser. this bar will be siplayed when you click on apps. so it wil be like home screen of the 'browser', and you can type link to visit an app.
	•	Wallet Injection:
Injects the currently selected smartprofile’s Session Wallet address and web3 provider into web apps upon loading.
	•	Transaction Confirmation:
Uses custom UI to show users transaction details clearly, including:
	•	From: Active Session Wallet
	•	Gas/network fees
	•	Routing summary (e.g., Linked EOA → Session Wallet → dApp)


3. Wallet

The Wallet tab provides insights into the user’s total crypto holdings and transaction management.

Wallet Screen:
	•	Unified Balance View:
Shows aggregated balances from all linked accounts in the active smartprofile.
	•	Asset List:
Displays a detailed breakdown of individual tokens, NFTs, and assets across EVM and Solana chains.
	•	Transaction History:
View and manage past transactions initiated through the Session Wallet.
	•	Send/Receive Functionality:
Users can easily send crypto assets from linked accounts via the Session Wallet and access their wallet address (QR/share link) to receive assets.


Transaction & Delegation Flow (Detailed)

Example User Scenario:
	•	User creates a Gaming smartprofile.
	•	User links MetaMask account and approves unlimited USDC allowance to the profile’s Session Wallet.
	•	User opens an app (e.g., Uniswap) via Interspace’s Apps screen.
	•	User initiates a USDC transaction in-app.


Session Wallet (Profile-specific proxy) 
   ↓ executes `ERC20.transferFrom(userEOA, appAddress, amount)`
ERC-20 Contract (USDC)
   ↓ transfers tokens
Target App Contract


The Session Wallet directly calls ERC20.transferFrom to pull allowed USDC from MetaMask (user’s EOA) without explicit per-transaction approvals.
	•	No deposits to Session Wallet; it is purely an on-chain proxy delegate.



Thirdweb Integration ():
	•	Authentication and wallet management are powered by Thirdweb’s headless APIs.
	•	We use React Hooks from Thirdweb for all wallet-related operations:
	•	Connect/disconnect wallets.
	•	Create, read, update, delete smartprofiles (via backend).
	•	Initiate and sign transactions using the Session Wallet (EVM & Solana compatible).
	•	No Thirdweb UI components used: Fully custom UI built in React Native.


-----


sharing some additional product docs. requreiments etc:

### In-App Browser

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Open web3 apps in the built-in browser | WebView renders dApp correctly |
| Active Profile Account automatically injected on page load | dApp detects wallet, can request transactions |

### Apps Management

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Bookmark web3 apps for quick access | App saved with name, URL, icon |
| View all bookmarked apps in Apps page list view | Scrollable list with app cards |
| Rename bookmarked apps | Name updates in UI and database |
| Reorder apps in the list | CRUD operations: add, remove, reorder |
| Remove bookmarked apps | Confirmation dialog, app deleted |
| Tap app card to open in browser with active profile | Browser opens with active profile injected |

### Folders & Organization

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Create folders to organize bookmarked apps | Folder created, apps can be nested inside |
| Rename folders | Name updates throughout app |
| Move folders and rearrange order | Visual feedback during move |
| Nest apps within folders | Apps display inside folder view |
| Make a folder public to get shareable link | Generate unique public URL |
| Share public folder links | Integration with native share sheet |
| All folders are private by default | Public toggle explicitly required |

# Epic: Smartprofiles

### Profile Management

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Create a new smartprofile with a custom name | Profile created with auto-generated Profile Account (ERC-7702) address |
| Rename existing smartprofiles | Name updated in database and UI |
| Delete a smartprofile | Show warnings, handle constraints for linked accounts |
| View the Profile Account address for each smartprofile | Address displayed as "session wallet" in profile details |
| Copy the Profile Account address to clipboard | Show confirmation on successful copy |
| Switch between different smartprofiles | Active profile updates, browser injects new profile |

### Account Management

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Link external EOAs and smart wallets to any smartprofile | Support MetaMask, Coinbase Wallet, Ledger, L2s, Safe, WalletConnect |
| Disconnect linked accounts from a smartprofile | Account removed from profile, update UI |
| Set preferred account for transaction routing | When profile active, tx flows: user EOA → Profile Account → dApp |
| Set one linked account as primary | Primary badge shown, routing logic updated |
| View which account is currently set as primary | Visual indicator on primary account |
| Copy any linked account address to clipboard | Show confirmation on successful copy |
| Assign custom names to linked accounts | Names persist in database, display in UI |
| View appropriate wallet logo/icon for each linked account | Correct logos shown based on wallet type |

### Social Integration

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Link Farcaster handle to a smartprofile | OAuth flow completes, handle linked (dependent on provider OAuth scope) |
| Link Telegram handle to a smartprofile | OAuth flow completes, handle linked (dependent on provider OAuth scope) |
| Disconnect linked social accounts | Account unlinked, UI updated |

# Epic: Wallet Features

### Balance & Assets

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| View unified balance across all linked accounts in active profile | Sum of all account balances displayed |
| View breakdown of assets across all linked accounts | List shows balance per account |
| View individual token balances | ERC-20 tokens listed with amounts |
| View Smartprofile MPC Account Address | Display Profile Account address clearly |

### Transactions

| ***User Story*** | ***Acceptance Criteria*** |
| --- | --- |
| Receive tokens to any linked account or Profile Account | QR code and address display |
| Send tokens from any linked account | Transaction routes through Profile Account with relay/sponsor handling |
| Swap tokens using integrated swap functionality | Swap UI with rate quotes, routing |
| See custom transaction confirmation sheet | Replaces provider UI, shows: from account, gas/network, route summary |
| Approve/reject transactions with routing visibility | Shows path: EOA → Profile Account → dApp |


-----

- Principles
    
    We are mobile-1st, favor dark mode, and aim for minimal. 1Password, Apple and Telegram are our north stars.  
    
    | **Principle** | **Description** | **Example** |
    | --- | --- | --- |
    | Space-themed design | Use deep, rich backgrounds with bright accents to guide focus. Optimize empty space for clarity. Apply soft glows and smooth gradients on key actions. | **Apple App Store (dark mode):** Dark mode uses rich blacks with vibrant highlights. App cards float with subtle shadows, and empty space frames key content. |
    | **Exploration** | Let users navigate freely across networks and platforms, both on-chain and off-chain. | **Apple Safari (iOS)**: Users swipe between open tabs like a carousel, with smooth transitions and easy cross-device access. **Apple Spotlight Search**: Search across all apps, documents, and web results instantly without needing to open each app individually.  |
    | **Control Over Privacy** | Be clear about accounts, security, and permissions. Provide easy-to-access data controls. | **1Password**: Clear dashboard to manage accounts and items with easy to edit fields. The browser extension auto detects and auto fills on desktop and mobile.   |
    | **Delightful** | Add small, unexpected touches to increase engagement and satisfaction. | **Telegram:** In-chat features like smooth reply threads, message forwarding with context, and quick reactions that make conversations feel more dynamic and interactive without being intrusive. |
    | **Speed with Simplicity** | Keep the platform fast, simple, and intuitive. Focus on essential actions with a clean design. | **Sign in with Apple (iOS)**: One-click sign-in with a clear, minimal interface and fast autofill for existing users. |
    | **Unified Experience** | Ensure a consistent design across desktop and mobile, with unified features and access. | **Apple App Store (Mobile & Desktop):** Identical app presentation, search structure, and purchase flows across all devices.  |


------


this repo is the frontend repo. we are starting from scratch. remember that i want to use best standards in terms of secruity. we have the following documentation from our backedn team:


Interspace Backend API
Backend API for Interspace MVP wallet with SmartProfiles, ERC-7702 session wallets, and iPhone-style app management.

🎯 Ready for React Native Integration
✅ Production-Ready Status: All 39 tests passing with real Thirdweb SDK integration verified.

The b ackedn server will start on http://localhost:3000 with full CORS support for React Native development.




📊 Complete API Reference
Base URL: http://localhost:3000/api/v1

Authentication Endpoints
POST /auth/authenticate
Authenticate user with Thirdweb wallet signature.

{
  "authToken": "thirdweb_auth_token",
  "authStrategy": "wallet",
  "deviceId": "unique_device_id", 
  "deviceName": "iPhone 15 Pro",
  "deviceType": "mobile",
  "walletAddress": "0x1234...abcd"
}
Response:

{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 900
  }
}
POST /auth/refresh
Refresh expired access token.

{ "refreshToken": "refresh_token" }
POST /auth/logout
Logout and invalidate tokens.

{ "refreshToken": "refresh_token" }
SmartProfile Endpoints
GET /profiles
Get all user profiles.

Headers: Authorization: Bearer <token>

Response:

{
  "success": true,
  "data": [
    {
      "id": "profile_id",
      "name": "Gaming Profile",
      "isActive": true,
      "sessionWalletAddress": "0x5678...efgh",
      "linkedAccountsCount": 2,
      "appsCount": 5,
      "foldersCount": 2,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
POST /profiles
Create new SmartProfile.

{ "name": "Trading Profile" }
GET /profiles/:id
Get specific profile details.

PUT /profiles/:id
Update profile.

{ 
  "name": "Updated Name",
  "isActive": true 
}
DELETE /profiles/:id
Delete profile (with safety checks).

POST /profiles/:id/activate
Set profile as active.

Linked Account Endpoints
GET /profiles/:profileId/accounts
Get linked external accounts.

POST /profiles/:profileId/accounts
Link external wallet account.

{
  "address": "0xabcd...1234",
  "walletType": "metamask",
  "customName": "My MetaMask",
  "isPrimary": false
}
PUT /accounts/:accountId
Update linked account.

DELETE /accounts/:accountId
Unlink account.

POST /accounts/:accountId/primary
Set account as primary.

App Management Endpoints
GET /profiles/:profileId/apps
Get bookmarked apps.

POST /profiles/:profileId/apps
Bookmark new app.

{
  "name": "Uniswap",
  "url": "https://app.uniswap.org",
  "iconUrl": "https://app.uniswap.org/favicon.ico",
  "folderId": "folder_id_or_null",
  "position": 1
}
PUT /apps/:appId
Update app bookmark.

DELETE /apps/:appId
Remove bookmark.

POST /apps/reorder
Reorder apps (iPhone-style).

{
  "appIds": ["app1", "app2", "app3"],
  "folderId": "folder_id_or_null"
}
Folder Management Endpoints
GET /profiles/:profileId/folders
Get folders.

POST /profiles/:profileId/folders
Create folder.

{
  "name": "DeFi Apps",
  "color": "#FF6B6B",
  "position": 1
}
PUT /folders/:folderId
Update folder.

DELETE /folders/:folderId
Delete folder (moves apps to root).

POST /folders/:folderId/share
Make folder publicly shareable.

Response:

{
  "success": true,
  "data": {
    "shareableId": "abc123",
    "shareableUrl": "https://app.interspace.com/shared/folders/abc123"
  }
}
Session Wallet Endpoints
Session wallets are automatically created for each SmartProfile using ERC-7702 proxy contracts.

Key Features:

Gas Sponsoring: Enabled by default
Multi-chain: Supports Ethereum, Polygon, Arbitrum, Optimism, Base
Proxy Pattern: ERC-7702 for secure delegation
Batch Transactions: Execute multiple transactions atomically
🔐 Authentication & Security
JWT Token Management
// Token refresh logic for React Native
const refreshTokenIfNeeded = async () => {
  const token = await getStoredToken();
  if (isTokenExpired(token)) {
    const refreshToken = await getStoredRefreshToken();
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    const { accessToken } = await response.json();
    await storeToken(accessToken);
    return accessToken;
  }
  return token;
};
Multi-device Support
Each device gets a unique session:

const deviceInfo = {
  deviceId: await DeviceInfo.getUniqueId(),
  deviceName: await DeviceInfo.getDeviceName(),
  deviceType: 'mobile'
};


🔄 Session Wallet Flow
Complete Transaction Routing
React Native App
    ↓ (User initiates transaction)
Thirdweb SDK in RN
    ↓ (Auth token to backend)
Interspace Backend API
    ↓ (Session wallet delegation)
ERC-7702 Proxy Contract
    ↓ (Execute on behalf of user)
Target dApp Contract
Example: DeFi Transaction
User: Wants to swap tokens on Uniswap
React Native: Opens Uniswap in WebView with injected wallet
Session Wallet: Handles transaction without approval prompts
Result: Seamless user experience with full security


## __INTERSPACE DATABASE SCHEMA FOR FRONTEND TEAM__

### __🔐 1. USER AUTHENTICATION & DEVICES__

__`users` Table:__

```typescript
{
  id: string              // Primary key
  email?: string          // Optional email
  hashedPassword?: string // For email/password auth
  emailVerified: boolean  // Email verification status
  authStrategies?: string // JSON array of auth methods
  isGuest: boolean        // Guest user flag
  walletAddress?: string  // Primary wallet (SIWE auth)
  createdAt: Date
  updatedAt: Date
}
```

__`device_registrations` Table:__

```typescript
{
  id: string
  userId: string          // Links to user
  deviceId: string        // Unique device identifier
  deviceName: string      // "John's iPhone"
  deviceType: string      // "ios", "android", "web"
  fingerprint?: string    // Device fingerprint
  lastActiveAt: Date
  isActive: boolean
  createdAt: Date
}
```

__`refresh_tokens` Table:__

```typescript
{
  id: string
  userId: string
  token: string          // JWT refresh token
  expiresAt: Date
  createdAt: Date
}
```

### __👤 2. SMARTPROFILES (CORE FEATURE)__

__`smart_profiles` Table:__

```typescript
{
  id: string
  userId: string
  name: string                    // "Trading", "Gaming", etc.
  sessionWalletAddress: string    // ERC-7702 proxy address
  isActive: boolean              // Currently selected profile
  createdAt: Date
  updatedAt: Date
}
```

__`linked_accounts` Table:__

```typescript
{
  id: string
  userId: string
  profileId?: string             // Which profile this account belongs to
  address: string               // Wallet address
  authStrategy: string          // "wallet", "social"
  walletType?: string          // "metamask", "coinbase", "walletconnect"
  customName?: string          // User-defined name
  isPrimary: boolean           // Primary account for profile
  isActive: boolean
  chainId?: number
  metadata?: string            // JSON metadata
  createdAt: Date
  updatedAt: Date
}
```

__`token_allowances` Table:__

```typescript
{
  id: string
  linkedAccountId: string
  tokenAddress: string         // ERC-20 token contract
  allowanceAmount: string      // BigInt as string
  chainId: number
  createdAt: Date
  updatedAt: Date
}
```

### __📱 3. APPS & FOLDERS (IPHONE-STYLE HOME SCREEN)__

__`folders` Table:__

```typescript
{
  id: string
  profileId: string
  name: string                 // "DeFi Apps", "Games"
  position: number            // Order on home screen
  isPublic: boolean          // Shareable folder
  shareableId?: string       // Public sharing ID
  color?: string             // Folder color theme
  createdAt: Date
  updatedAt: Date
}
```

__`bookmarked_apps` Table:__

```typescript
{
  id: string
  profileId: string
  folderId?: string          // Optional folder assignment
  name: string               // Custom app name
  url: string                // App URL
  iconUrl?: string           // App icon
  position: number           // Position in grid/folder
  createdAt: Date
  updatedAt: Date
}
```

__`app_metadata` Table (System):__

```typescript
{
  id: string
  url: string                // Canonical app URL
  name: string               // Official app name
  description?: string
  iconUrl?: string           // Official icon
  category?: string          // "defi", "nft", "gaming"
  isVerified: boolean        // Verified app status
  tags: string              // JSON array of tags
  createdAt: Date
  updatedAt: Date
}
```

### __🔗 4. SOCIAL INTEGRATION__

__`social_profiles` Table:__

```typescript
{
  id: string
  profileId: string
  provider: string           // "farcaster", "telegram", "twitter"
  providerId: string         // External user ID
  username?: string
  displayName?: string
  avatarUrl?: string
  accessToken?: string       // Encrypted OAuth token
  refreshToken?: string      // Encrypted refresh token
  createdAt: Date
  updatedAt: Date
}
```

### __💰 5. TRANSACTIONS & WALLET DATA__

__`transactions` Table:__

```typescript
{
  id: string
  profileId: string
  hash: string               // Transaction hash
  chainId: number
  fromAddress: string
  toAddress: string
  value: string             // BigInt as string
  gasUsed?: string          // BigInt as string
  gasPrice?: string         // BigInt as string
  status: string            // "pending", "confirmed", "failed"
  blockNumber?: number
  blockTimestamp?: Date
  nonce?: number
  
  // Interspace-specific routing
  routingType?: string      // "direct", "session_wallet", "batch"
  sourceAccount?: string    // Original EOA
  sessionWallet?: string    // Session wallet used
  targetApp?: string        // dApp URL
  
  input?: string           // Transaction data
  logs?: string            // JSON logs
  createdAt: Date
  updatedAt: Date
}
```

### __🏭 6. SYSTEM TABLES__

__`session_wallet_factories` Table:__

```typescript
{
  id: string
  chainId: number
  factoryAddress: string     // Factory contract address
  implementationAddress: string
  isActive: boolean
  createdAt: Date
}
```

__`audit_logs` Table:__

```typescript
{
  id: string
  userId?: string
  profileId?: string
  action: string            // "create_profile", "link_account"
  resource: string          // What was acted upon
  details?: string          // JSON details
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}
```

## __🔗 KEY RELATIONSHIPS FOR FRONTEND__

1. __User → SmartProfiles (1:many)__
2. __SmartProfile → LinkedAccounts (1:many)__
3. __SmartProfile → Folders (1:many)__
4. __SmartProfile → BookmarkedApps (1:many)__
5. __Folder → BookmarkedApps (1:many)__
6. __LinkedAccount → TokenAllowances (1:many)__

## __📝 IMPORTANT NOTES FOR REACT NATIVE__

- __All IDs are CUIDs__ (not auto-increment numbers)
- __BigInt values stored as strings__ (value, gasUsed, allowanceAmount)
- __JSON fields__ need parsing (authStrategies, metadata, tags, logs)
- __Unique constraints__ enforced on critical fields
- __Cascade deletes__ properly configured for cleanup





--------

some additional docuemtnation frmo thirdweb about auth and profile.

Configure in-app wallets
The simplest way to create an in-app wallet is to use the inAppWallet() function. By default, this will create a wallet that supports email/password login, Google, Apple, Facebook login, and passkey.

import { inAppWallet } from "thirdweb/wallets";
 
const wallet = inAppWallet();

You can also customize the wallet by passing in options.

import { inAppWallet } from "thirdweb/wallets";
 
const wallet = inAppWallet({
  auth: {
    mode, // options are "popup" | "redirect" | "window";
    options, // ex: ["discord", "farcaster", "apple", "facebook", "google", "passkey"],
    passkeyDomain, // for passkey, the domain that the passkey is created on
    redirectUrl, // the URL to redirect to after authentication
  },
  metadata, // metadata for the wallet (name, icon, etc.)
  smartAccount, // smart account options for the wallet (for gasless tx)
});

InAppWalletCreationOptions
type InAppWalletCreationOptions =
  | {
      auth?: {
        allowedSmsCountryCodes?: Array<SupportedSmsCountry>;
        defaultSmsCountryCode?: SupportedSmsCountry;
        mode?: "popup" | "redirect" | "window";
        options: Array<InAppWalletAuth>;
        passkeyDomain?: string;
        redirectUrl?: string;
      };
      executionMode?: ExecutionModeOptions;
      hidePrivateKeyExport?: boolean;
      metadata?: {
        icon?: string;
        image?: {
          alt?: string;
          height?: number;
          src: string;
          width?: number;
        };
        name?: string;
      };
      partnerId?: string;
      smartAccount?: SmartWalletOptions;
      storage?: AsyncStorage;
    }
  | undefined;


Usage with your own UI
You have full control with the connection hooks and functions to build your own UI. Pick an authentication strategy and then connect.

Setup the ThirdwebProvider
This will ensure that the wallet is available to all components in your app, handle connection states and auto-connection on page load.

import { ThirdwebProvider } from "thirdweb/react";
 
<ThirdwebProvider>
  <YourApp />
</ThirdwebProvider>;

Authenticate via Google
Note that for Apple and Facebook, you just need to update the strategy to "facebook" or "apple".

In React and React Native, the useConnect() hook handles authentication and connection states.

import { inAppWallet } from "thirdweb/wallets";
import { useConnect } from "thirdweb/react";
 
const { connect } = useConnect();
 
const handleLogin = async () => {
  await connect(async () => {
    const wallet = inAppWallet();
    await wallet.connect({
      client,
      strategy: "google",
    });
    return wallet;
  });
};

Other social options include Apple, Facebook, Discord, Farcaster and more.

Authenticate via Email verification
import {
  inAppWallet,
  preAuthenticate,
} from "thirdweb/wallets/in-app";
 
const { connect } = useConnect();
 
const preLogin = async (email: string) => {
  // send email verification code
  await preAuthenticate({
    client,
    strategy: "email",
    email, // ex: user@example.com
  });
};
 
const handleLogin = async (
  email: string,
  verificationCode: string,
) => {
  // verify email and connect
  await connect(async () => {
    const wallet = inAppWallet();
    await wallet.connect({
      client,
      strategy: "email",
      email,
      verificationCode,
    });
    return wallet;
  });
};

Authenticate via Phone number verification
import {
  inAppWallet,
  preAuthenticate,
} from "thirdweb/wallets/in-app";
 
const { connect } = useConnect();
 
const preLogin = async (phoneNumber: string) => {
  // send phone number verification code
  await preAuthenticate({
    client,
    strategy: "phone",
    phoneNumber, // ex: +1234567890
  });
};
 
const handleLogin = async (
  phoneNumber: string,
  verificationCode: string,
) => {
  // verify phone number and connect
  await connect(async () => {
    const wallet = inAppWallet();
    await wallet.connect({
      client,
      strategy: "phone",
      phoneNumber,
      verificationCode,
    });
    return wallet;
  });
};

Authenticate via Passkey
React Native support
For React Native, passkeyDomain is required and must be set to a valid app universal link. To setup universal links for your application, follow the iOS documentation and Android documentation.

import {
  inAppWallet,
  hasStoredPasskey,
} from "thirdweb/wallets/in-app";
 
const { connect } = useConnect();
 
const handleLogin = async () => {
  await connect(async () => {
    const wallet = inAppWallet({
      auth: {
        passkeyDomain: "example.com", // defaults to current url
      },
    });
    const hasPasskey = await hasStoredPasskey(client);
    await wallet.connect({
      client,
      strategy: "passkey",
      type: hasPasskey ? "sign-in" : "sign-up",
    });
    return wallet;
  });
};

Authenticate with an external wallet
You can also use wallets as an authentication method, when using this method, both external and in-app wallets are connected, and you can switch between the 2 at any time.

import { inAppWallet } from "thirdweb/wallets/in-app";
import { sepolia } from "thirdweb/chains";
 
const { connect } = useConnect();
 
const handleLogin = async () => {
  await connect(async () => {
    const wallet = inAppWallet();
    await wallet.connect({
      client,
      strategy: "wallet",
      wallet: createWallet("io.metamask"), // or any other wallet
      chain: sepolia, // required for SIWE
    });
    return wallet;
  });
};

Authenticate as Guest
You can also create wallets for your users without any input at all. This will create a session that can be later upgraded by linking another identity. Great for progressive onboarding.

import { inAppWallet } from "thirdweb/wallets/in-app";
 
const { connect } = useConnect();
 
const handleLogin = async () => {
  await connect(async () => {
    const wallet = inAppWallet();
    await wallet.connect({
      client,
      strategy: "guest",
    });
    return wallet;
  });
};


ERC-4337 Smart Accounts
Convert any wallet to a ERC-4337 smart account to your application.

Let users connect to their smart account using any personal wallet, including in-app wallets for easy onboarding.
Automatically deploy individual account contracts for your users when they do their first onchain transaction.
Sponsor gas costs for all transactions via the thirdweb paymaster.
Sponsored transactions
To set up sponsored transactions, set the sponsorGas option to true in the smart account configuration. All transactions performed with the smart account will then be sponsored by your application. Testnet transactions are free, but you need a valid credit card on file for mainnet transactions.



Usage with your own UI
You can also use the connection hooks and functions to connect to your smart accounts and build your fully custom UI.

import { useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { sepolia } from "thirdweb/chains";
 
function App() {
  // 1. set the `accountAbstraction` configuration to convert wallets to smart accounts
  const { connect } = useConnect({
    client,
    accountAbstraction: {
      chain: sepolia, // the chain where your smart accounts will be or is deployed
      sponsorGas: true, // enable or disable sponsored transactions
    },
  });
 
  const connectToSmartAccount = async () => {
    // 2. connect with the admin wallet of the smart account
    connect(async () => {
      const wallet = inAppWallet(); // or any other wallet
      await wallet.connect({
        client,
        chain: sepolia,
        strategy: "google",
      });
      return wallet;
    });
  };
 
  return (
    <button onClick={() => connectToSmartAccount()}>Connect</button>
  );
}

Auto connection of smart accounts
When building your own UI, remember to also pass the accountAbstraction prop to useAutoConnect to always reconnect to the smart account on page reload.

Refer to the Smart Wallet API reference for more advanced configuration of your smart accounts.

useLinkProfile
Links a web2 or web3 profile to the connected in-app or ecosystem account. When a profile is linked to the account, that profile can then be used to sign into the same account.

Example
Linking a social profile
import { useLinkProfile } from "thirdweb/react";
 
const { mutate: linkProfile } = useLinkProfile();
 
const onClick = () => {
  linkProfile({
    client,
    strategy: "discord", // or "google", "x", "telegram", etc
  });
};

Linking an email
import { useLinkProfile } from "thirdweb/react";
import { preAuthenticate } from "thirdweb/wallets";
 
const { mutate: linkProfile } = useLinkProfile();
 
// send a verification email first
const sendEmail = async () => {
  const email = await preAuthenticate({
    client,
    strategy: "email",
    email: "john.doe@example.com",
  });
};
 
// then link the profile with the verification code
const onClick = (code: string) => {
  linkProfile({
    client,
    strategy: "email",
    email: "john.doe@example.com",
    verificationCode: code,
  });
};

The same process can be used for phone and email, simply swap out the strategy parameter.

Linking a wallet
import { useLinkProfile } from "thirdweb/react";
 
const { mutate: linkProfile } = useLinkProfile();
 
const onClick = () => {
  linkProfile({
    client,
    strategy: "wallet",
    wallet: createWallet("io.metamask"), // autocompletion for 400+ wallet ids
    chain: sepolia, // any chain works, needed for SIWE signature
  });
};


Signature
function useLinkProfile(): UseMutationResult<
  Array<Profile>,
  Error,
  AuthArgsType,
  unknown
>;

Returns

Return Type
let returnType: UseMutationResult<
  Array<Profile>,
  Error,
  AuthArgsType,
  unknown
>;


useProfiles
Retrieves all linked profiles of the connected in-app or ecosystem account.

Example
import { useProfiles } from "thirdweb/react";
 
const { data: profiles } = useProfiles({
  client,
});
 
console.log("Type:", profiles[0].type); // "discord"
console.log("Email:", profiles[0].details.email); // "john.doe@example.com"


Signature
function useProfiles(args: {
  client: ThirdwebClient;
}): UseQueryResult<Array<Profile>>;

Parameters

args
Type
let args: { client: ThirdwebClient };

Returns

Return Type
let returnType: UseQueryResult<Array<Profile>>;

A React Query result containing the linked profiles for the connected in-app account. This hook will only run if the connected wallet supports account linking.



useUnlinkProfile
Unlinks a web2 or web3 profile currently connected in-app or ecosystem account. When a profile is unlinked from the account, it will no longer be able to be used to sign into the account.

Example
Unlinking an email account
import { useUnlinkProfile } from "thirdweb/react";
 
const { data: connectedProfiles, isLoading } = useProfiles({
  client: props.client,
});
const { mutate: unlinkProfile } = useUnlinkProfile();
 
const onClick = () => {
  unlinkProfile({
    client,
    // Select any other profile you want to unlink
    profileToUnlink: connectedProfiles[1],
  });
};


Signature
function useUnlinkProfile(): UseMutationResult<
  void,
  Error,
  { client: ThirdwebClient; profileToUnlink: Profile },
  unknown
>;

Returns

Return Type
let returnType: UseMutationResult<
  void,
  Error,
  { client: ThirdwebClient; profileToUnlink: Profile },
  unknown
>;


useWalletBalance
Fetch the balance of a wallet in native currency or for a specific token. Leave tokenAddress undefined to fetch the native token balance.

Example
Fetching the native token balance
import { useWalletBalance } from "thirdweb/react";
 
const { data, isLoading, isError } = useWalletBalance({
  chain,
  address,
  client,
});
console.log("balance", data?.displayValue, data?.symbol);

Fetching a specific token balance
import { useWalletBalance } from "thirdweb/react";
 
const tokenAddress = "0x..."; // the ERC20 token address
 
const { data, isLoading, isError } = useWalletBalance({
  chain,
  address,
  client,
  tokenAddress,
});
console.log("balance", data?.displayValue, data?.symbol);


Signature
function useWalletBalance(
  options: {
    address: undefined | string;
    chain: undefined | Readonly<ChainOptions & { rpc: string }>;
    client: ThirdwebClient;
    tokenAddress?: string;
  },
  queryOptions?: UseWalletBalanceQueryOptions,
): UseQueryResult<GetBalanceResult>;

Parameters

options
GetWalletBalanceOptions - The options for fetching the wallet balance.

Type
let options: {
  address: undefined | string;
  chain: undefined | Readonly<ChainOptions & { rpc: string }>;
  client: ThirdwebClient;
  tokenAddress?: string;
};


queryOptions
optional
Type
let queryOptions: UseWalletBalanceQueryOptions;

Returns

Return Type
let returnType: UseQueryResult<GetBalanceResult>;

GetWalletBalanceResult The result of the query.



useWalletImage
Returns the wallet icon for the provided wallet id.

Example
import { useWalletImage } from "thirdweb/react";
 
const { data: walletImage } = useWalletImage("io.metamask");
 
return <img src={walletImage} alt="MetaMask logo" />;


Signature
function useWalletImage(
  id: undefined | WalletId,
): UseQueryResult<string, Error>;

Parameters

id
Type
let id: undefined | WalletId;

Returns

Return Type
let returnType: UseQueryResult<string, Error>;



useWalletInfo
Returns the wallet info for the provided wallet id.

Example
import { useWalletInfo } from "thirdweb/react";
 
const { data: walletInfo } = useWalletInfo("io.metamask");
console.log("wallet name", walletInfo?.name);


Signature
function useWalletInfo(
  id: undefined | WalletId,
): UseQueryResult<WalletInfo, Error>;

Parameters

id
Type
let id: undefined | WalletId;

Returns

Return Type
let returnType: UseQueryResult<WalletInfo, Error>;



there is more i can share as needed.


----


at the bottom we will have 3 tabs - Apps, Profile, and Wallet. when you open the app, if user is not connected/looged in, we will use guest account as described in thirdweb doc

we will talk about UI shortly. understand the project and plan before we talk about UI specifically