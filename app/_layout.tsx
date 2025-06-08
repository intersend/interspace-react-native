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

	return (
                <GestureHandlerRootView style={{ flex: 1 }}>
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
                </GestureHandlerRootView>
	);
}
