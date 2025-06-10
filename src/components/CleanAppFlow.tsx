import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleOnboarding from './onboarding/AppleOnboarding';
import AppleNativeAuthScreen from './auth/AppleNativeAuthScreen';
import { useAuth } from '../hooks/useAuth';

interface CleanAppFlowProps {
  children: React.ReactNode;
}

type AppState = 'loading' | 'onboarding' | 'authentication' | 'authenticated';
type OnboardingPath = 'guest' | 'wallet' | 'sign-in';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'interspace_onboarding_completed',
} as const;

export default function CleanAppFlow({ children }: CleanAppFlowProps) {
  const [appState, setAppState] = useState<AppState>('loading');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  // Clean authentication system
  const { isAuthenticated, isLoading: authLoading, user, login } = useAuth();

  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Initialize app state - check onboarding status only
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Monitor authentication state changes - single source of truth
  useEffect(() => {
    console.log('🔍 CleanAppFlow monitoring auth state:');
    console.log('  📊 isAuthenticated:', isAuthenticated);
    console.log('  👤 user:', !!user);
    console.log('  ⏳ authLoading:', authLoading);
    console.log('  🏠 appState:', appState);
    
    // Don't make decisions while auth is loading
    if (authLoading) {
      console.log('⏳ Auth loading, waiting for final state...');
      return;
    }

    // Don't override loading or onboarding states
    if (appState === 'loading' || appState === 'onboarding') {
      console.log('⏸️ In special state, not changing based on auth');
      return;
    }

    // Update app state based on authentication
    if (isAuthenticated && user) {
      console.log('✅ User authenticated, showing main app');
      setAppState('authenticated');
    } else {
      const shouldAutoLogin =
        process.env.EXPO_PUBLIC_AUTO_LOGIN_GUEST === 'true' &&
        !autoLoginAttempted;

      if (shouldAutoLogin) {
        console.log('🤖 Auto guest login enabled, attempting login...');
        setAutoLoginAttempted(true);
        login({ strategy: 'guest' })
          .then(() => {
            console.log('✅ Auto guest login successful');
            setAppState('authenticated');
          })
          .catch(err => {
            console.error('❌ Auto guest login failed:', err);
            setAppState('authentication');
          });
      } else {
        console.log('🔓 User not authenticated, showing auth screen');
        setAppState('authentication');
      }
    }
  }, [isAuthenticated, authLoading, user, appState, autoLoginAttempted]);

  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Checking onboarding status...');
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      setHasCompletedOnboarding(!!onboardingCompleted);
      
      if (onboardingCompleted) {
        console.log('✅ Onboarding completed previously');
        // Let auth state monitoring handle the next state
        setAppState('authentication');
      } else {
        console.log('👋 First time user, showing onboarding');
        setAppState('onboarding');
      }
    } catch (error) {
      console.error('Failed to check onboarding state:', error);
      // Default to onboarding on error
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = async (path: OnboardingPath) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      console.log('✅ Onboarding completed with path:', path);
      setHasCompletedOnboarding(true);
      
      // Just show the auth screen - let user choose how to proceed
      // NO AUTO-LOGIN based on path
      setAppState('authentication');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still proceed to authentication
      setAppState('authentication');
    }
  };

  const handleAuthSuccess = () => {
    console.log('🎉 Auth success callback - auth state will update automatically');
    // Don't need to do anything here - useAuth will update isAuthenticated
    // and our effect will handle the state transition
  };

  // Render based on app state
  switch (appState) {
    case 'loading':
      // Could add a splash screen here
      return null;
    
    case 'onboarding':
      return (
        <AppleOnboarding 
          onComplete={handleOnboardingComplete}
        />
      );
    
    case 'authentication':
      return (
        <AppleNativeAuthScreen 
          onAuthSuccess={handleAuthSuccess}
        />
      );
    
    case 'authenticated':
      // Final check before showing main app
      if (!isAuthenticated || !user) {
        console.warn('⚠️ In authenticated state but user not authenticated');
        // This shouldn't happen with our new logic, but if it does, 
        // the effect will handle it
        return null;
      }
      return <>{children}</>;
    
    default:
      console.error('❌ Unknown app state:', appState);
      return null;
  }
}
