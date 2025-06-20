# Interspace - React Native Web3 Wallet Wrapper

A mobile-first crypto wallet built with React Native, designed to simplify Web3 app interactions through smartprofiles, app management, and intuitive wallet interactions.

## 🚀 Overview

Interspace is a wallet wrapper that allows users to:
- Bring existing crypto accounts and wrap them with 'session' wallets
- Abstract tokens, gas, and chains while using Web3 apps
- Organize accounts into smartprofiles (Trading, Gaming, Payments, etc.)
- Access Web3 apps through an iPhone-style home screen interface

### First-Party Authentication & Silence Labs Integration

Interspace uses a first-party authentication flow. When users log in with Google,
Apple, email, or passkey, a new wallet is created through the Silence Labs Duo
node and linked to their account. Authentication tokens are issued by the
Interspace backend and stored securely on the device.

## 🛠 Tech Stack

- **Frontend**: React Native (fully custom UI)
- **Backend/Wallet Infrastructure**: Interspace backend with a Silence Labs Duo node
- **Authentication**: First-party JWT flow with wallet creation through Silence Labs
- **Wallet Proxy Standard**: ERC-7702 proxy accounts for delegation and transaction handling

## 📱 Key Features

### 1. Profiles
- Create smartprofiles to group crypto accounts by context
- Each profile has its own Session Wallet (ERC-7702 Proxy)
- Link existing wallets (MetaMask, Coinbase, etc.)
- Grant ERC-20 token allowances for seamless transactions

### 2. Apps
- iOS inspired home screen with dynamic app icons and folders
- Horizontal paging with page dots just like iOS
- Drag-and-drop organization and folder creation
- Built-in browser with wallet injection
- Custom transaction confirmation UI

### 3. Wallet
- Unified balance view across all linked accounts
- Detailed asset breakdown (tokens, NFTs)
- Transaction history
- Send/receive functionality

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native development environment
- iOS Simulator or Android Emulator
- GitHub personal access token for Silence Labs packages

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/interspace-react-native.git
cd interspace-react-native
```

2. Configure npm for Silence Labs packages (.npmrc):
```bash
cat <<'EOF' > .npmrc
@silencelaboratories:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<YOUR_GITHUB_TOKEN>
EOF
```

3. Install dependencies:
```bash
npm install
# or
yarn install
```

4. Install wallet SDKs:
```bash
npm install @metamask/sdk @coinbase/wallet-mobile-sdk @rainbow-me/rainbowkit
```
5. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and configure endpoints:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_SILENCELABS_NODE_URL=https://api.silencelabs.org
EXPO_PUBLIC_DISABLE_SILENCELABS=false
EXPO_PUBLIC_DISABLE_WALLET_APIS=false
EXPO_PUBLIC_AUTO_LOGIN_GUEST=false
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your-web-client-id>
```
6. Prebuild native directories:
```bash
npx expo prebuild
```

7. Start the backend server (required):
```bash
# Make sure the backend is running on http://localhost:3000
# See backend repository for setup instructions
```

8. Run the app:
```bash
# iOS
yarn ios

# Android
yarn android
```

## 🏗 Project Structure

```
interspace-react-native/
├── app/                    # App navigation and screens
│   ├── (tabs)/            # Tab navigation screens
│   └── index.tsx          # Entry point
├── src/
│   ├── components/        # React components
│   │   ├── apps/         # App management components
│   │   ├── auth/         # Authentication components
│   │   ├── profiles/     # Profile management
│   │   ├── transaction/  # Transaction UI
│   │   └── wallet/       # Wallet components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── assets/              # Images and fonts
└── constants/           # App constants
```

## 🔐 Security Features

- Guest account by default (no login required)
- ERC-7702 session wallets for secure delegation
- No direct deposits to session wallets
- Explicit token allowances for transactions
- Multi-device support with JWT authentication

## 🧪 Running Tests

1. Install dependencies using the provided setup script:

   ```bash
   npm run setup-tests
   ```

2. Run the test suite:

   ```bash
   npm test
   ```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For help with:
- **Backend API**: See backend repository documentation
- **Silence Labs SDK**: Check your private documentation
- **React Native**: Check [React Native Documentation](https://reactnative.dev)

## 🔗 Related Repositories

- [Interspace Backend](https://github.com/yourusername/interspace-backend) - Backend API server
