import { createThirdwebClient } from "thirdweb";
import { 
  ethereum, 
  polygon, 
  arbitrum, 
  optimism, 
  base,
  sepolia,
  polygonMumbai,
  arbitrumSepolia,
  optimismSepolia,
  baseSepolia
} from "thirdweb/chains";

const clientId = process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID!;

if (!clientId) {
	throw new Error(
		"Missing EXPO_PUBLIC_THIRDWEB_CLIENT_ID - make sure to set it in your .env file",
	);
}

// Interspace Thirdweb Client Configuration
export const client = createThirdwebClient({
	clientId,
	secretKey: process.env.THIRDWEB_SECRET_KEY, // For server-side operations
});

// Supported Chains for Interspace
export const MAINNET_CHAINS = [
	ethereum,
	polygon,
	arbitrum,
	optimism,
	base,
];

export const TESTNET_CHAINS = [
	sepolia,
	polygonMumbai,
	arbitrumSepolia,
	optimismSepolia,
	baseSepolia,
];

// Default chain for Interspace (Base for lower fees)
export const DEFAULT_CHAIN = base;
export const DEFAULT_TESTNET_CHAIN = baseSepolia;

// Smart Account Configuration for ERC-7702 Session Wallets
export const SMART_ACCOUNT_CONFIG = {
	gasless: true, // Enable gas sponsoring
	bundlerUrl: `https://${DEFAULT_CHAIN.id}.bundler.thirdweb.com`,
	paymasterUrl: `https://${DEFAULT_CHAIN.id}.bundler.thirdweb.com`,
};

// Common token contracts across chains
export const TOKEN_CONTRACTS = {
	// USDC contracts by chain
	USDC: {
		[ethereum.id]: "0xA0b86a33E6417c8f7BdF34Ac541c73dc056D7F4a",
		[polygon.id]: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
		[arbitrum.id]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
		[optimism.id]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
		[base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
	},
	// USDT contracts by chain
	USDT: {
		[ethereum.id]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		[polygon.id]: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
		[arbitrum.id]: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
		[optimism.id]: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
	},
};
