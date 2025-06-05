/**
 * Interspace Color Palette - Space-themed design with Apple inspiration
 * Deep cosmic backgrounds, silver metallics, and bright accents
 * Following Apple Human Interface Guidelines with space theme
 */

const tintColorLight = "#007AFF";  // Apple blue
const tintColorDark = "#0A84FF";   // Apple blue (dark mode)

export const Colors = {
  light: {
    text: "#000000",
    subtext: "#8E8E93",           // Apple gray
    textInverted: "#FFFFFF",
    background: "#FFFFFF",
    surface: "#F2F2F7",           // Apple light gray
    surfaceSecondary: "#FFFFFF",
    tint: tintColorLight,
    icon: "#8E8E93",
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorLight,
    border: "#C6C6C8",            // Apple separator
    borderLight: "#E5E5EA",
    success: "#34C759",           // Apple green
    warning: "#FF9500",           // Apple orange
    error: "#FF3B30",             // Apple red
    // Space theme colors
    cosmic: "#1D1D41",
    starfield: "#2D2D5F",
    nebula: "#4A4A8A",
  },
  dark: {
    // Core text colors
    text: "#FFFFFF",
    subtext: "#8E8E93",           // Apple gray (same in dark)
    textSecondary: "#C0C0C8",     // Silver metallic
    textTertiary: "#98989F",      // Muted silver
    textInverted: "#000000",
    
    // Background hierarchy
    background: "#000000",        // Pure black (Apple style)
    backgroundElevated: "#0A0A0A", // Slightly elevated
    surface: "#1C1C1E",          // Apple dark surface
    surfaceSecondary: "#2C2C2E",  // Secondary surface
    surfaceElevated: "#1C1C1E",   // Elevated cards
    
    // Brand colors
    tint: tintColorDark,          // Apple blue
    tintSecondary: "#00D4AA",     // Interspace mint (secondary accent)
    
    // Icons and controls
    icon: "#8E8E93",
    iconSecondary: "#C0C0C8",     // Silver metallic icons
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorDark,
    
    // Borders and separators
    border: "#38383A",            // Apple dark border
    borderLight: "#2C2C2E",       // Lighter border
    separator: "#54545C",         // Apple separator
    
    // Status colors
    success: "#30D158",           // Apple green (dark)
    warning: "#FF9F0A",           // Apple orange (dark)
    error: "#FF453A",             // Apple red (dark)
    
    // Space theme colors
    cosmic: "#0F0F23",            // Deep space background
    starfield: "#1A1A3A",         // Mid-space background
    nebula: "#2D2D5A",            // Nebula accent
    cosmicGlow: "#4A4AFF",        // Cosmic blue glow
    silverGlow: "#B8B8C8",        // Silver metallic glow
    
    // Authentication specific
    authBackground: "#000000",     // Pure black for auth screens
    authSurface: "#1C1C1E",       // Cards on auth screens
    authBorder: "#2C2C2E",        // Subtle borders
    authAccent: "#007AFF",        // Primary action color
    
    // Social authentication
    socialApple: "#FFFFFF",       // Apple white
    socialGoogle: "#FFFFFF",      // Google white
    socialFacebook: "#1877F2",    // Facebook blue
    socialDiscord: "#5865F2",     // Discord blurple
    
    // Wallet specific colors
    walletMetaMask: "#F6851B",    // MetaMask orange
    walletCoinbase: "#0052FF",    // Coinbase blue
    walletTrust: "#3375BB",       // Trust Wallet blue
    walletRainbow: "#FF6B6B",     // Rainbow red
  },
};

// Apple-inspired design tokens
export const SpaceTokens = {
  // Spacing (Apple's 8pt grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius (Apple's rounded corners)
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  
  // Typography scale (Apple-inspired)
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },
  
  // Font weights (Apple's SF font characteristics)
  fontWeight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
    heavy: '800' as '800',
  },
  
  // Shadows (Apple-style subtle shadows)
  shadow: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    } as const,
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    } as const,
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    } as const,
  },
};
