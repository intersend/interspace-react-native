import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import AuthScreen from './AuthScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthWrapper - Handles authentication state and shows appropriate UI
 * 
 * Usage:
 * <AuthWrapper>
 *   <YourMainAppContent />
 * </AuthWrapper>
 */
export default function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state during auth initialization
  if (isLoading) {
    return fallback || <View style={styles.container} />;
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <AuthScreen 
          onAuthSuccess={() => {
            // Navigation will happen automatically due to auth state change
            console.log('🎉 User authenticated, redirecting to main app...');
          }}
          allowGuest={true}
        />
      </View>
    );
  }

  // Show main app if authenticated
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
