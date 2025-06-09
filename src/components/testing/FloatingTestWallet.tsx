import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useTestWallet } from '../../hooks/useTestWallet';
import TestWalletModal from './TestWalletModal';

interface FloatingTestWalletProps {
  onPress?: () => void;
  position?: 'default' | 'auth-screen';
  showTransactionConfirmation?: boolean;
}

export default function FloatingTestWallet({ 
  onPress, 
  position = 'default', 
  showTransactionConfirmation = false 
}: FloatingTestWalletProps) {
  const { isDevelopment, hasActiveWallet, pendingCount } = useTestWallet();
  const [showModal, setShowModal] = useState(false);

  // `useTestWallet` exposes `isDevelopment` based on `__DEV__`. This ensures
  // the floating test wallet never appears in production or staging builds.
  if (!isDevelopment) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowModal(true);
    }
  };

  // Dynamic styles based on position
  const containerStyle = [
    styles.container,
    position === 'auth-screen' && styles.authScreenPosition
  ];

  const buttonStyle = [
    styles.floatingButton,
    position === 'auth-screen' && styles.authScreenButton
  ];

  return (
    <>
      <View style={containerStyle}>
        <TouchableOpacity
          style={buttonStyle}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {/* Pulsing animation for pending requests */}
          {pendingCount > 0 && (
            <Animated.View style={styles.pulseRing} />
          )}
          
          {/* Main button content */}
          <View style={styles.buttonContent}>
            <Text style={styles.walletIcon}>🧪</Text>
            <Text style={styles.testLabel}>TEST</Text>
            
            {/* Active wallet indicator */}
            {hasActiveWallet && (
              <View style={styles.activeIndicator}>
                <View style={styles.activeDot} />
              </View>
            )}
            
            {/* Pending count badge */}
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingCount}>{pendingCount}</Text>
              </View>
            )}
          </View>
          
          {/* Development warning border */}
          <View style={styles.warningBorder} />
        </TouchableOpacity>
        
        {/* Development label */}
        <View style={styles.devLabel}>
          <Text style={styles.devLabelText}>DEV ONLY</Text>
        </View>
      </View>

      {/* Test Wallet Modal */}
      <TestWalletModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  authScreenPosition: {
    bottom: Platform.OS === 'ios' ? 50 : 30,
    right: 16,
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35', // Bright orange for visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  authScreenButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  walletIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  testLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#00FF00',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeDot: {
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  pendingBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF0000',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pendingCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  warningBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold warning border
    borderStyle: 'dashed',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
  },
  devLabel: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  devLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
