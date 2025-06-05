import { Platform } from 'react-native';

let HapticFeedback: any = null;

// Only import haptic feedback on native platforms
if (Platform.OS !== 'web') {
  try {
    HapticFeedback = require('react-native-haptic-feedback').default;
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
}

export const hapticTrigger = (type: string, options?: any) => {
  if (Platform.OS === 'web') {
    // On web, we could potentially use the Vibration API
    return;
  }
  
  if (HapticFeedback && HapticFeedback.trigger) {
    try {
      HapticFeedback.trigger(type, options);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }
};

// Export commonly used haptic types
export const HapticTypes = {
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  impactHeavy: 'impactHeavy',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  notificationError: 'notificationError',
  selection: 'selection',
};
