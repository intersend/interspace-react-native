import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingSlider from './onboarding/OnboardingSlider';
import AuthScreen from './auth/AuthScreen';
import { useAuth } from '../hooks/useAuth';

interface AppFlowProps {
  children: React.ReactNode;
}

type AppState = 'onboarding' | 'authentication' | 'authenticated';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'interspace_onboarding_completed',
} as const;

export default function AppFlow({ children }: AppFlowProps) {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [isLoading, setIsLoading] = useState(true);
  
  // Integrate with useAuth hook
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Debug AppFlow's view of useAuth state - force frequent logging
  useEffect(() => {
    console.log('🔍 AppFlow useAuth state debug:');
    console.log('  📊 isAuthenticated:', isAuthenticated);
    console.log('  👤 user:', !!user);
    console.log('  ⏳ authLoading:', authLoading);
    console.log('  🎯 appState:', appState);
    if (user) {
      console.log('  📄 user details:', { id: user.id, isGuest: user.isGuest, walletAddress: user.walletAddress });
    }
  }, [isAuthenticated, user, authLoading, appState]);

  // Additional debugging - log on every render to catch missed state changes
  useEffect(() => {
    console.log('🔄 AppFlow render detected - current useAuth state:');
    console.log('  🎯 isAuthenticated:', isAuthenticated, '👤 user:', !!user, '⏳ authLoading:', authLoading);
  });

  useEffect(() => {
    checkAppState();
  }, []); // Only run once on mount - remove problematic dependencies

  // Monitor authentication state changes - this should be the primary driver
  useEffect(() => {
    console.log('🔄 AppFlow auth state effect triggered!');
    console.log('  📊 authLoading:', authLoading);
    console.log('  🎯 isAuthenticated:', isAuthenticated);
    console.log('  👤 user:', !!user);
    console.log('  🏠 appState:', appState);
    
    if (!authLoading) {
      console.log('🔍 Auth state changed - isAuthenticated:', isAuthenticated, 'user:', !!user);
      
      // Only update app state if not in onboarding
      if (appState !== 'onboarding') {
        if (isAuthenticated && user) {
          console.log('✅ User authenticated via useAuth, showing main app');
          console.log('🔄 Setting appState from', appState, 'to authenticated');
          setAppState('authenticated');
          console.log('✅ AppState transition to authenticated completed');
        } else {
          console.log('🔓 User not authenticated via useAuth, showing auth screen');
          console.log('🔄 Setting appState from', appState, 'to authentication');
          setAppState('authentication');
          console.log('✅ AppState transition to authentication completed');
        }
      } else {
        console.log('⏸️ Skipping auth state change - currently in onboarding');
      }
    } else {
      console.log('⏳ Auth still loading, waiting...');
    }
  }, [isAuthenticated, authLoading, user, appState]);

  const checkAppState = async () => {
    try {
      // Check if onboarding has been completed
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      
      if (onboardingCompleted) {
        console.log('✅ Onboarding completed, checking auth state...');
        
        // Check if user is already authenticated (post-reload scenario)
        if (isAuthenticated && user && !authLoading) {
          console.log('🚀 User already authenticated after reload, going directly to main app');
          setAppState('authenticated');
        } else {
          console.log('🔄 Auth state pending, defaulting to authentication screen');
          setAppState('authentication'); // Will be updated by auth effect
        }
      } else {
        console.log('👋 First time user, showing onboarding');
        setAppState('onboarding');
      }
    } catch (error) {
      console.error('Failed to check app state:', error);
      // Default to onboarding on error
      setAppState('onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      console.log('✅ Onboarding completed, moving to authentication');
      setAppState('authentication');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still proceed to authentication
      setAppState('authentication');
    }
  };

  const handleAuthSuccess = () => {
    console.log('🎉 Auth success - letting useAuth state drive navigation');
    // Remove manual state transition - let useAuth state changes drive AppFlow
    // The useEffect monitoring isAuthenticated will handle the transition
  };

  // Show loading while checking app state or auth state
  if (isLoading || (appState !== 'onboarding' && authLoading)) {
    // Could add a splash screen here
    return null;
  }

  switch (appState) {
    case 'onboarding':
      return <OnboardingSlider onComplete={handleOnboardingComplete} />;
    
    case 'authentication':
      return <AuthScreen onAuthSuccess={handleAuthSuccess} allowGuest={true} />;
    
    case 'authenticated':
      // Double-check authentication before showing main app
      console.log('🔍 AppFlow authenticated check - isAuthenticated:', isAuthenticated, 'user:', !!user, 'authLoading:', authLoading);
      if (isAuthenticated && user) {
        console.log('✅ Authentication validated, showing main app');
        return <>{children}</>;
      } else {
        // Fallback to auth screen if somehow we're in authenticated state but not actually authenticated
        console.warn('⚠️ In authenticated state but user not actually authenticated, falling back to auth screen');
        console.warn('⚠️ Debug - isAuthenticated:', isAuthenticated, 'user:', !!user, 'userDetails:', user);
        setAppState('authentication');
        return <AuthScreen onAuthSuccess={handleAuthSuccess} allowGuest={true} />;
      }
    
    default:
      return <OnboardingSlider onComplete={handleOnboardingComplete} />;
  }
}
