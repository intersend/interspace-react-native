import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleOnboarding from './onboarding/AppleOnboarding';
import AppleAuthScreen from './auth/AppleAuthScreen';
import { useAuth } from '../hooks/useAuth';

interface AppleAppFlowProps {
  children: React.ReactNode;
}

type AppState = 'loading' | 'onboarding' | 'authentication' | 'authenticated';
type OnboardingPath = 'guest' | 'wallet' | 'sign-in';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'interspace_onboarding_completed',
} as const;

export default function AppleAppFlow({ children }: AppleAppFlowProps) {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authPath, setAuthPath] = useState<OnboardingPath>('guest');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Clean authentication system
  const { isAuthenticated, isLoading: authLoading, user, login, logout } = useAuth();

  // Force update mechanism for immediate state synchronization
  const forceUpdate = () => {
    console.log('🚀 Forcing AppleAppFlow update to check auth state');
    setUpdateTrigger(prev => prev + 1);
  };

  // Handle logout with force update
  const handleLogout = async () => {
    console.log('🔄 AppleAppFlow handling logout with force update');
    await logout(forceUpdate);
  };

  // Initialize app state
  useEffect(() => {
    initializeApp();
  }, []);

  // Monitor authentication state changes with detailed logging
  useEffect(() => {
    console.log('🔍 AppleAppFlow auth state monitoring triggered:');
    console.log('  📊 isAuthenticated:', isAuthenticated);
    console.log('  👤 user:', !!user);
    console.log('  ⏳ authLoading:', authLoading);
    console.log('  🏠 appState:', appState);
    console.log('  🔄 updateTrigger:', updateTrigger);
    
    if (!authLoading) {
      if (appState !== 'loading' && appState !== 'onboarding') {
        if (isAuthenticated && user) {
          console.log('✅ Auth conditions met - transitioning to authenticated state');
          console.log('🔄 Setting appState from', appState, 'to authenticated');
          setAppState('authenticated');
        } else {
          console.log('🔓 Not authenticated - transitioning to auth screen');
          console.log('🔄 Setting appState from', appState, 'to authentication');
          // Reset authPath to 'choice' when transitioning from authenticated state
          if (appState === 'authenticated') {
            setAuthPath('choice' as OnboardingPath);
          }
          setAppState('authentication');
        }
      } else {
        console.log('⏸️ Skipping auth state change - in', appState, 'mode');
      }
    } else {
      console.log('⏳ Auth still loading, waiting...');
    }
  }, [isAuthenticated, authLoading, user, appState, updateTrigger]);

  // Additional effect to force transition after authentication
  useEffect(() => {
    if (isAuthenticated && user && !authLoading && appState === 'authentication') {
      console.log('🚀 Force transition: authenticated user detected while in auth screen');
      setTimeout(() => {
        setAppState('authenticated');
      }, 100);
    }
  }, [isAuthenticated, user, authLoading, appState]);

  const initializeApp = async () => {
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
          setAppState('authentication');
        }
      } else {
        console.log('👋 First time user, showing Apple onboarding');
        setAppState('onboarding');
      }
    } catch (error) {
      console.error('Failed to check app state:', error);
      // Default to onboarding on error
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = async (path: OnboardingPath) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      console.log('✅ Apple onboarding completed with path:', path);
      
      // Set the authentication path and transition
      setAuthPath(path);
      setAppState('authentication');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still proceed to authentication
      setAuthPath(path);
      setAppState('authentication');
    }
  };

  const handleAuthSuccess = () => {
    console.log('🎉 Apple auth success - forcing immediate state update');
    forceUpdate(); // Force immediate state synchronization
  };

  // Show loading while checking app state
  if (appState === 'loading') {
    // Return null for now - could add Apple-style splash screen
    return null;
  }

  // Don't show blank screen during auth loading - let auth screen handle its own loading
  // This prevents the blank screen that makes auth appear to fail

  switch (appState) {
    case 'onboarding':
      return (
        <AppleOnboarding 
          onComplete={handleOnboardingComplete}
        />
      );
    
    case 'authentication':
      return (
        <AppleAuthScreen 
          initialPath={authPath}
          onAuthSuccess={handleAuthSuccess}
        />
      );
    
    case 'authenticated':
      // Double-check authentication before showing main app
      console.log('🔍 AppleAppFlow authenticated check - isAuthenticated:', isAuthenticated, 'user:', !!user, 'authLoading:', authLoading);
      if (isAuthenticated && user) {
        console.log('✅ Authentication validated, showing main app');
        return <>{children}</>;
      } else {
        // Fallback to auth screen if somehow we're in authenticated state but not actually authenticated
        console.warn('⚠️ In authenticated state but user not actually authenticated, falling back to auth screen');
        console.warn('⚠️ Debug - isAuthenticated:', isAuthenticated, 'user:', !!user, 'userDetails:', user);
        setAppState('authentication');
        return (
          <AppleAuthScreen 
            initialPath="choice"  // Always show choice after logout
            onAuthSuccess={handleAuthSuccess}
          />
        );
      }
    
    default:
      return (
        <AppleOnboarding 
          onComplete={handleOnboardingComplete}
        />
      );
  }
}
