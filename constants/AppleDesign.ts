/**
 * Apple Design System for Interspace
 * Based on Apple's Human Interface Guidelines and iOS design tokens
 * Combines Apple's principles with Interspace's space theme
 */

// Apple's SF Pro Typography Scale (iOS 16+)
export const AppleTypography = {
  // Display (Large titles for major screens)
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  
  // Titles (Screen and section headers)
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  
  // Body text
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.43,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.43,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  
  // Secondary text
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  
  // Labels and captions
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
};

// Apple's 8pt Grid System
export const AppleSpacing = {
  micro: 4,     // 0.5 × 8pt - Tight spacing
  small: 8,     // 1 × 8pt - Standard spacing
  medium: 16,   // 2 × 8pt - Section spacing
  large: 24,    // 3 × 8pt - Component spacing
  xlarge: 32,   // 4 × 8pt - Screen margins
  xxlarge: 40,  // 5 × 8pt - Major sections
  xxxlarge: 48, // 6 × 8pt - Hero sections
};

// Apple's Corner Radius System
export const AppleRadius = {
  tight: 6,     // Small buttons and inputs
  standard: 10, // Default UI elements (Apple's most common)
  medium: 14,   // Cards and panels
  large: 18,    // Major containers
  xlarge: 22,   // Screen-level elements
  continuous: 999, // Fully rounded (pills)
};

// Apple's Touch Targets
export const AppleTouchTargets = {
  minimum: 44,  // Apple's minimum touch target
  comfortable: 50, // Recommended for primary actions
  large: 56,    // For accessibility
};

// iOS Semantic Colors (Dark Mode Optimized)
export const AppleColors = {
  // Background hierarchy
  systemBackground: '#000000',           // Pure black (iOS dark mode)
  secondarySystemBackground: '#1C1C1E',  // Elevated surfaces
  tertiarySystemBackground: '#2C2C2E',   // Higher elevation
  
  // Grouped background (for lists)
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  
  // Fill colors (for buttons, selections)
  systemFill: '#787880',
  secondarySystemFill: '#78788033',
  tertiarySystemFill: '#7878801F',
  quaternarySystemFill: '#78788014',
  
  // Text colors
  label: '#FFFFFF',              // Primary text
  secondaryLabel: '#EBEBF599',   // Secondary text
  tertiaryLabel: '#EBEBF54D',    // Tertiary text
  quaternaryLabel: '#EBEBF530',  // Quaternary text
  placeholderText: '#EBEBF54D',  // Placeholder text
  
  // Tint colors (interactive elements)
  systemBlue: '#007AFF',         // Primary actions
  systemGreen: '#30D158',        // Success states
  systemIndigo: '#5856D6',       // Alternative accent
  systemOrange: '#FF9F0A',       // Warning states
  systemPink: '#FF2D92',         // Accent color
  systemPurple: '#AF52DE',       // Alternative accent
  systemRed: '#FF453A',          // Error states
  systemTeal: '#40C8E0',         // Accent color
  systemYellow: '#FFD60A',       // Warning/attention
  
  // Gray scale
  systemGray: '#8E8E93',         // Standard gray
  systemGray2: '#636366',        // Darker gray
  systemGray3: '#48484A',        // Even darker
  systemGray4: '#3A3A3C',        // Very dark gray
  systemGray5: '#2C2C2E',        // Almost black
  systemGray6: '#1C1C1E',        // Deepest gray
  
  // Separator colors
  separator: '#54545899',        // Standard separators
  opaqueSeparator: '#38383A',    // Opaque separators
  
  // Interspace Space Theme Integration
  cosmic: '#000000',             // Deep space (matches systemBackground)
  starfield: '#1C1C1E',          // Mid-space (matches secondary background)
  nebula: '#2C2C2E',             // Distant nebula (matches tertiary)
  cosmicBlue: '#007AFF',         // Cosmic accent (matches systemBlue)
  silverGlow: '#EBEBF599',       // Metallic glow (matches secondaryLabel)
};

// Apple's Animation Curves and Timing
export const AppleAnimations = {
  // Spring animations (iOS standard)
  spring: {
    damping: 0.8,
    stiffness: 400,
    mass: 1,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  
  // Timing curves
  curves: {
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)', // Apple's default
  },
  
  // Duration values
  duration: {
    micro: 150,    // Quick feedback
    short: 250,    // Standard transitions
    medium: 400,   // Apple's default
    long: 600,     // Complex transitions
    extended: 1000, // Hero animations
  },
};

// Apple's Shadow System
export const AppleShadows = {
  // Elevation levels (matching iOS)
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 2.5,
    elevation: 3,
  },
  level3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 5.0,
    elevation: 6,
  },
  level4: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 7.5,
    elevation: 10,
  },
  level5: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 10.0,
    elevation: 15,
  },
};

// Apple Button Styles
export const AppleButtons = {
  primary: {
    height: AppleTouchTargets.comfortable,
    borderRadius: AppleRadius.standard,
    backgroundColor: AppleColors.systemBlue,
    paddingHorizontal: AppleSpacing.large,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...AppleShadows.level1,
  },
  secondary: {
    height: AppleTouchTargets.comfortable,
    borderRadius: AppleRadius.standard,
    backgroundColor: AppleColors.secondarySystemBackground,
    borderWidth: 0.5,
    borderColor: AppleColors.separator,
    paddingHorizontal: AppleSpacing.large,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tertiary: {
    height: AppleTouchTargets.comfortable,
    borderRadius: AppleRadius.standard,
    backgroundColor: 'transparent',
    paddingHorizontal: AppleSpacing.large,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};

// Apple Form Elements
export const AppleForms = {
  textInput: {
    height: AppleTouchTargets.minimum,
    borderRadius: AppleRadius.standard,
    backgroundColor: AppleColors.tertiarySystemBackground,
    borderWidth: 0,
    paddingHorizontal: AppleSpacing.medium,
    paddingVertical: AppleSpacing.small,
    fontSize: AppleTypography.body.fontSize,
    color: AppleColors.label,
  },
  textInputFocused: {
    backgroundColor: AppleColors.secondarySystemBackground,
    borderWidth: 1,
    borderColor: AppleColors.systemBlue,
  },
  textInputError: {
    backgroundColor: AppleColors.tertiarySystemBackground,
    borderWidth: 1,
    borderColor: AppleColors.systemRed,
  },
};

// Apple Card Styles
export const AppleCards = {
  standard: {
    backgroundColor: AppleColors.secondarySystemBackground,
    borderRadius: AppleRadius.medium,
    padding: AppleSpacing.large,
    ...AppleShadows.level2,
  },
  elevated: {
    backgroundColor: AppleColors.tertiarySystemBackground,
    borderRadius: AppleRadius.medium,
    padding: AppleSpacing.large,
    ...AppleShadows.level3,
  },
  minimal: {
    backgroundColor: AppleColors.secondarySystemBackground,
    borderRadius: AppleRadius.medium,
    padding: AppleSpacing.large,
    borderWidth: 0.5,
    borderColor: AppleColors.separator,
  },
};

// Export everything for easy access
export const Apple = {
  Typography: AppleTypography,
  Spacing: AppleSpacing,
  Radius: AppleRadius,
  TouchTargets: AppleTouchTargets,
  Colors: AppleColors,
  Animations: AppleAnimations,
  Shadows: AppleShadows,
  Buttons: AppleButtons,
  Forms: AppleForms,
  Cards: AppleCards,
};

export default Apple;
