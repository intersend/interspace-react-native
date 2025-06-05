# Interspace - React Native Web3 Wallet Wrapper

A mobile-first crypto wallet built with React Native, designed to simplify Web3 app interactions through smartprofiles, app management, and intuitive wallet interactions.

## 🚀 Overview

Interspace is a wallet wrapper that allows users to:
- Bring existing crypto accounts and wrap them with 'session' wallets
- Abstract tokens, gas, and chains while using Web3 apps
- Organize accounts into smartprofiles (Trading, Gaming, Payments, etc.)
- Access Web3 apps through an iPhone-style home screen interface

## 🛠 Tech Stack

- **Frontend**: React Native (fully custom UI)
- **Backend/Wallet Infrastructure**: Thirdweb (React Hooks only, no built-in UI components)
- **Authentication**: Thirdweb provider for EVM
- **Wallet Proxy Standard**: ERC-7702 proxy accounts for delegation and transaction handling

## 📱 Key Features

### 1. Profiles
- Create smartprofiles to group crypto accounts by context
- Each profile has its own Session Wallet (ERC-7702 Proxy)
- Link existing wallets (MetaMask, Coinbase, etc.)
- Grant ERC-20 token allowances for seamless transactions

### 2. Apps
- iPhone-style home screen with bookmarked Web3 apps
- Drag-and-drop app organization with folders
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
- Thirdweb client ID

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/interspace-react-native.git
cd interspace-react-native
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your Thirdweb client ID:
```
EXPO_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```

4. Prebuild native directories:
```bash
npx expo prebuild
```

5. Start the backend server (required):
```bash
# Make sure the backend is running on http://localhost:3000
# See backend repository for setup instructions
```

6. Run the app:
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

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For help with:
- **Backend API**: See backend repository documentation
- **Thirdweb SDK**: Visit [Thirdweb Documentation](https://portal.thirdweb.com)
- **React Native**: Check [React Native Documentation](https://reactnative.dev)

## 🔗 Related Repositories

- [Interspace Backend](https://github.com/yourusername/interspace-backend) - Backend API server
