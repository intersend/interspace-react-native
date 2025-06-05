import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";
import TestWalletSystem from "../../src/components/testing/TestWalletSystem";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<>
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
					tabBarInactiveTintColor: Colors[colorScheme ?? "dark"].tabIconDefault,
					tabBarStyle: {
						backgroundColor: Colors[colorScheme ?? "dark"].background,
						borderTopColor: Colors[colorScheme ?? "dark"].background,
						height: 88,
						paddingBottom: 34,
						paddingTop: 8,
					},
					headerShown: false,
				}}
			>
				<Tabs.Screen
					name="apps"
					options={{
						title: "Apps",
						tabBarIcon: ({ color, focused }) => (
							<TabBarIcon
								name={focused ? "grid" : "grid-outline"}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name="profiles"
					options={{
						title: "Profiles",
						tabBarIcon: ({ color, focused }) => (
							<TabBarIcon
								name={focused ? "person-circle" : "person-circle-outline"}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name="wallet"
					options={{
						title: "Wallet",
						tabBarIcon: ({ color, focused }) => (
							<TabBarIcon
								name={focused ? "wallet" : "wallet-outline"}
								color={color}
							/>
						),
					}}
				/>
			</Tabs>
			
			{/* Test Wallet System - Development Only */}
			<TestWalletSystem />
		</>
	);
}
