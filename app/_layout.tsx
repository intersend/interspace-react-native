import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { MetaMaskSDKOptions } from "@metamask/sdk";

import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "react-native";
import { Colors } from "../constants/Colors";
import CleanAppFlow from "../src/components/CleanAppFlow";
import { AuthProvider } from "../src/contexts/AuthContext";
import { SessionWalletProvider } from "../src/contexts/SessionWalletContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	// Custom theme configuration for Interspace
	const InterspaceTheme = {
		...DarkTheme,
		colors: {
			...DarkTheme.colors,
			primary: Colors.dark.tint,
			background: Colors.dark.background,
			card: Colors.dark.surface,
			text: Colors.dark.text,
			border: Colors.dark.border,
			notification: Colors.dark.tint,
		},
	};

	// MetaMask SDK Options
	const metamaskSdkOptions: MetaMaskSDKOptions = {
		dappMetadata: {
			name: "Interspace",
			url: "https://interspace.com", // Replace with your dapp's URL
		},
		// Use Orby's virtual node RPC URL here.
		// This is a placeholder. You need to replace it with the actual Orby virtual node RPC URL.
		// Example: rpc: { "1": "https://rpc.orby.io/virtual-node/<YOUR_API_KEY>" }
		rpc: {
			// Placeholder for Orby's virtual node RPC URL
			// You need to replace "1" with the actual chain ID if different, and the URL.
			"1": "YOUR_ORBY_VIRTUAL_NODE_RPC_URL",
		},
		// @ts-ignore
		logging: true, // Enable logging for debugging
	};

	return (
		              <GestureHandlerRootView style={{ flex: 1 }}>
		                      {/* @ts-ignore */}
		                      <MetaMaskProvider sdkOptions={metamaskSdkOptions}>
		                              <SessionWalletProvider>
                                        <AuthProvider>
                                                <ThemeProvider value={InterspaceTheme}>
                                                        <StatusBar
                                                                backgroundColor={Colors.dark.background}
                                                                barStyle="light-content"
                                                        />
                                                        <CleanAppFlow>
                                                                <Stack>
                                                                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                                                        <Stack.Screen name="+not-found" />
                                                                </Stack>
                                                        </CleanAppFlow>
                                                </ThemeProvider>
                                        </AuthProvider>
                                </SessionWalletProvider>
                        </MetaMaskProvider>
                </GestureHandlerRootView>
	);
}
