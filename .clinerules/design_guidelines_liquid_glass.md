# Interspace Design Principles & Guidelines - Liquid Glass UI

## Core Design Philosophy

Interspace adopts Apple's Liquid Glass design language precisely, creating a fluid, dynamic interface that mirrors iOS's latest design system. Every component, animation, and interaction must exactly replicate Apple's implementation to ensure consistency with users' iOS experience.

### Foundation: Liquid Glass Material

**Visual Properties:**
- **Base Layer**: Deep black (#000000) background with subtle noise texture (1-2% opacity)
- **Glass Effect**: Multi-layered blur combining:
  - Background blur: 40px radius
  - Saturation: 180%
  - Luminosity blend at 50% opacity
  - Subtle inner glow: 0.5px white at 20% opacity
- **Dynamic Tinting**: Glass surfaces pick up underlying color vibrance and shift hue subtly based on content beneath

**Behavioral Properties:**
- Glass surfaces respond to touch with ripple effects originating from contact point
- Proximity-based morphing: Elements within 40px begin merging their glass boundaries
- Continuous reflow during transitions, never snapping or jumping

## Component-Specific Guidelines

### 1. Navigation & Tab Bar

**Bottom Tab Bar (Apps, Profile, Wallet):**
- **Container**: Floating capsule with Liquid Glass effect
- **Dimensions**: Height 82px, inset 20px from screen edges
- **Glass Properties**:
  - Regular glass variant with interactive response
  - Tinted with app's accent color at 8% opacity
  - Morphs into expanded state when tab content scrolls beneath

**Tab Items:**
- **Active State**: 
  - Icon scales to 1.1x with spring animation (damping: 0.7, stiffness: 300)
  - Glass pill forms behind active icon (28px height)
  - Label appears with fade-in (200ms ease-out)
- **Inactive State**: 
  - Icons at 0.8 opacity
  - No labels visible
  - Responds to hover/press with 0.95 scale

### 2. Apps Screen (iPhone Home Screen)

**Grid Layout:**
- **App Icons**: 
  - Size: 60x60px with 13px corner radius
  - Spacing: 26px horizontal, 32px vertical
  - Shadow: 0 2px 8px rgba(0,0,0,0.3)
  - Glass highlight overlay on top edge (2px, 20% white)

**Icon Interactions:**
- **Tap**: 
  - Scale down to 0.95 with spring animation
  - Subtle haptic feedback (light impact)
- **Long Press Edit Mode**:
  - Icons begin wiggling: ±2.5° rotation, 0.4s duration
  - Delete badges appear: red glass circle, top-left, with bounce animation
  - Drag creates glass trail effect following finger

**Folder Behavior:**
- **Folder Creation**: 
  - When icons overlap during drag, glass effects merge
  - Folder preview animates open with morph transition (400ms spring)
  - Background content scales to 0.95 and blurs (25px)
- **Folder Container**:
  - Expanded glass sheet with 20px corner radius
  - 3x3 grid of mini icons inside
  - Title input field with glass background

**Browser Bar (When App Clicked):**
- **Appearance**: Slides up from bottom with spring physics
- **Glass Container**: 
  - Height: 56px
  - Contains URL field with subtle glass inset
  - Share and reload buttons with interactive glass response

### 3. Profile Screen (Contact Card Style)

**Profile Header:**
- **Avatar Container**: 
  - 120x120px circular glass frame
  - 3px glass border with gradient shimmer
  - Parallax response to device tilt (±10px movement)
- **Name/Details Section**:
  - Glass card with 16px corner radius
  - Text uses SF Pro Display, white at 90% opacity
  - Subtle text shadow for glass depth

**Linked Accounts List:**
- **List Items**:
  - Glass rectangles with 12px corner radius
  - 64px height with 16px padding
  - Wallet logos at 32x32px
  - On tap: Glass effect intensifies, slight scale (1.02)
- **Spacing**: 8px between items allows glass effects to remain separate
- **Swipe Actions**: 
  - Reveal delete button with red-tinted glass
  - Elastic overscroll with glass stretching effect

**Section Headers:**
- **Typography**: SF Pro, 13px, 60% opacity
- **Not all caps** - use title case instead
- **Sticky behavior**: Headers gain glass background when scrolled

### 4. Wallet Screen (Apple Wallet Style)

**Balance Display:**
- **Large Number Animation**: 
  - Numbers morph between values, not flip
  - Each digit animates independently with slight delay (50ms cascade)
  - Glass shimmer effect on value change

**Asset Cards:**
- **Card Stack Layout**:
  - Cards peek from bottom (showing 44px of each)
  - Tap to expand with spring animation
  - Glass effects merge when cards stack closely
- **Individual Cards**:
  - Full glass background with token logo
  - Balance and USD value with number morphing
  - Sparkle animation on balance updates

**Transaction List:**
- **Row Height**: 72px for comfortable touch targets
- **Glass Separation**: 4px spacing prevents row merging
- **Swipe Actions**: Glass morphs to reveal action buttons

## Animation Specifications

### Glass Morphing Rules
```
Merge Distance: 40px
Merge Animation: 
- Duration: 400ms
- Easing: cubic-bezier(0.32, 0.72, 0, 1)
- Intermediate shapes use quadratic curves

Separation Animation:
- Duration: 350ms  
- Elastic overshoot: 1.05 scale before settling
```

### Interactive Response
```
Touch Down:
- Scale: 0.97
- Glass brightness: +10%
- Duration: 150ms
- Haptic: light impact

Touch Up:
- Scale: 1.0 with overshoot to 1.02
- Duration: 250ms
- Spring damping: 0.7
```

### Scrolling Behaviors
```
Overscroll:
- Elastic stretch with glass distortion
- Maximum stretch: 80px
- Glass effects intensify at boundaries

Scroll Under Navigation:
- Content glass merges with nav glass at contact
- Smooth 20px transition zone
- Content becomes 95% opacity when under nav
```

## Color System for Dark Mode

**Base Palette:**
- **Background**: #000000
- **Surface Glass**: rgba(255,255,255,0.08)
- **Text Primary**: rgba(255,255,255,0.90)
- **Text Secondary**: rgba(255,255,255,0.60)
- **Accent (Space Purple)**: #8B5CF6
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444

**Glass Tinting:**
- Profile sections: Purple tint at 5% opacity
- Wallet sections: Green tint at 5% opacity  
- Apps sections: Blue tint at 5% opacity

## Typography

**Font Family**: SF Pro Display (Display sizes), SF Pro Text (Body)

**Scale:**
- **Large Title**: 34px, weight 700, tracking -0.02em
- **Title 1**: 28px, weight 600
- **Title 2**: 22px, weight 600
- **Body**: 17px, weight 400
- **Caption**: 12px, weight 400

**Number Display:**
- Use SF Pro Rounded for friendly number display
- Tabular figures for aligned numbers
- Animated number morphing, never hard cuts

## Spacing System

Use 4px base unit with common multipliers:
- **Micro**: 4px
- **Small**: 8px  
- **Medium**: 16px
- **Large**: 24px
- **XL**: 32px
- **XXL**: 48px

## Implementation Notes for React Native

1. **Glass Effects**: Use `react-native-blur` with custom shader for exact iOS match
2. **Animations**: Leverage `react-native-reanimated` for 60fps glass morphing
3. **Haptics**: Use `react-native-haptic-feedback` matching iOS impact styles
4. **Gestures**: Implement with `react-native-gesture-handler` for iOS-perfect physics




------------------



# Extended Interspace Component Library - Liquid Glass UI

## Core Interactive Components

### 1. Transaction Confirmation Sheet (Apple Pay Style)

**Sheet Behavior:**
- **Entry Animation**: Slides up from bottom with spring physics (damping: 0.8, stiffness: 250)
- **Height**: Dynamic, typically 65% of screen height
- **Glass Container**: 
  - Extra thick glass (1.2x standard opacity)
  - 32px corner radius at top
  - Grabber pill: 36x5px, 30% white opacity, centered at top with 8px padding

**Layout Structure:**
```
[Grabber Pill]
[App Icon & Name]     [Cancel Button]
[Transaction Title]
[Amount Display]
[Transaction Details Card]
[Route Visualization]
[Gas Estimation]
[Confirm Button]
```

**Component Details:**

**App Identity Section:**
- **App Icon**: 48x48px with glass rim effect
- **App Name**: SF Pro Display, 17px, 90% white
- **Domain**: SF Pro Text, 13px, 50% white
- **Cancel Button**: Glass circle, 32x32px, "×" symbol

**Amount Display:**
- **Large Amount**: SF Pro Display, 56px, weight 700
- **Number Morphing**: Each digit animates independently
- **USD Equivalent**: SF Pro Text, 22px, 60% white, updates live
- **Pulse Animation**: Subtle glass shimmer on amount (2s loop)

**Transaction Details Card:**
- **Glass Card**: 16px corner radius, inset 16px from edges
- **Rows**: 
  - From: [Wallet Icon] Account Name → Session Wallet
  - To: [App Icon] Contract Address (truncated)
  - Network: [Chain Icon] Ethereum Mainnet
- **Row Height**: 56px with glass separator lines (1px, 10% white)

**Route Visualization:**
- **Animated Path**: 
  - Three glass nodes connected by animated dotted lines
  - Nodes: User Wallet → Session Wallet → dApp
  - Path animation: Dots travel along path (2s duration)
  - Glass glow follows the moving dots

**Gas Estimation Section:**
- **Container**: Subtle glass inset, 12px corner radius
- **Layout**: Network fee • Max fee • Time estimate
- **Real-time Updates**: Numbers morph as gas prices change
- **Warning State**: Orange glass tint if high gas

**Confirm Button:**
- **Dimensions**: Full width minus 32px padding, 56px height
- **Glass Style**: Thick glass with accent color tint
- **States**:
  - Default: "Confirm" with Face ID icon
  - Processing: Glass ripple effect from center
  - Success: Morphs to checkmark with green tint

### 2. Universal Creation Tray

**Activation:**
- **Trigger**: "+" button in navigation or FAB
- **Animation**: Glass orbs expand from touch point, merge into tray

**Tray Structure:**
- **Container**: Full-width bottom sheet, 40% screen height
- **Glass**: Thick variant with subtle grain texture
- **Corner Radius**: 32px top corners

**Option Grid:**
```
[+ New Profile]    [+ Link Account]
[+ Add App]        [+ Create Folder]
```

**Option Tiles:**
- **Size**: Dynamic width, 80px height
- **Glass Style**: Interactive glass with 16px corner radius
- **Icon**: 32x32px SF Symbol with glass rim
- **Label**: SF Pro Text, 15px, below icon
- **Hover State**: Glass brightens, slight float (translateY: -2px)

**Interaction Flow:**
- **Tap Animation**: 
  - Tile scales to 0.95, then expands to fill tray
  - Other tiles fade and scale down
  - Morphs into specific creation flow

### 3. Profile Switcher Tray

**Trigger**: Tap on current profile name/avatar

**Container:**
- **Height**: Dynamic based on profile count (max 70% screen)
- **Glass**: Medium thickness with profile color tints
- **List Style**: Edge-to-edge with 16px horizontal padding

**Profile Rows:**
- **Height**: 72px
- **Structure**: [Avatar] [Name & Address] [Checkmark]
- **Avatar**: 48x48px with animated glass rim
- **Active Indicator**: Glass checkmark morphs in with spring
- **Tap Response**: Glass ripple from touch point

**Quick Actions:**
- **Bottom Section**: Separated by glass divider
- **"Manage Profiles"**: Glass button with gear icon
- **"Create New"**: Glass button with + icon

### 4. Account Connection Flow

**Connection Sheet:**
- **Multi-Step**: Glass panels that morph between steps
- **Step Indicator**: Glass pills that fill as you progress

**Wallet Selection Grid:**
- **Grid Layout**: 2 columns of wallet options
- **Wallet Tiles**: 
  - 156px width, 120px height
  - Wallet logo: 48x48px centered
  - Wallet name below
  - Glass border highlights on hover

**Connecting State:**
- **Loading Animation**: 
  - Wallet logo pulses with glass shimmer
  - Circular progress ring draws around logo
  - Glass particles emit from center

**Permission Screen:**
- **Header**: "Approve Permissions" with glass backdrop
- **Permission List**:
  - Glass cards for each permission
  - Toggle switches with glass knobs
  - Explanatory text at 60% opacity

**Success State:**
- **Checkmark Animation**: 
  - Draws with glass trail effect
  - Burst of glass particles
  - Morphs into completion message

### 5. Send/Receive Screens

**Send Flow:**

**Amount Input:**
- **Number Pad**: 
  - Glass buttons in 3x4 grid
  - Each button 80x60px with 12px radius
  - Haptic feedback on tap
  - Number appears with morph animation

**Token Selector:**
- **Dropdown**: Glass capsule that expands on tap
- **Token List**: 
  - Icon + Symbol + Balance per row
  - Glass highlight on selection
  - Search bar with glass inset at top

**Recipient Input:**
- **Input Field**: 
  - Glass inset with 16px radius
  - ENS resolution with loading spinner
  - Address validator with checkmark animation

**Review Sheet:**
- **Similar to transaction confirmation**
- **Additional**: Max/Half/Min quick amount buttons

**Receive Screen:**

**QR Display:**
- **Container**: Glass card with thick borders
- **QR Code**: 
  - 240x240px centered
  - White on glass background
  - Subtle rotation animation (360° over 20s)
  - Glass shimmer sweeps across (3s intervals)

**Address Display:**
- **Address**: Monospace font, 16px
- **Copy Button**: Glass pill with copy icon
- **Share Button**: Glass pill with share icon
- **Success Feedback**: Green glass flash on copy

### 6. Swap Interface

**Token Pair Card:**
- **Container**: Thick glass with 20px radius
- **From/To Sections**: 
  - Separated by glass divider with swap icon
  - Token amount input with large numbers
  - Token selector button on right

**Swap Button (Center):**
- **Circular**: 48x48px glass button
- **Icon**: Arrows that rotate on tap
- **Connects**: The two token sections with glass bridge

**Rate Information:**
- **Glass Info Bar**: Below token pair
- **Contents**: Rate • Price impact • Route
- **Expandable**: Tap for detailed route visualization

**Confirm Swap:**
- **Similar to transaction sheet**
- **Addition**: Slippage tolerance selector (glass pills: 0.1%, 0.5%, 1%, Custom)

### 7. Search Interface

**Search Bar:**
- **Activation**: Expands from icon to full bar
- **Glass Container**: 44px height, full corner radius
- **Magnifier Icon**: Morphs to indicate search type
- **Clear Button**: Glass circle with × (appears when typing)

**Search Results:**
- **Live Results**: Appear below with glass cards
- **Categories**: Apps • Tokens • Transactions • Profiles
- **Result Rows**: 
  - Icon + Primary text + Secondary text
  - Glass highlight on hover
  - Tap animates to destination

### 8. Settings & Preferences

**Settings List:**
- **Grouped Sections**: Glass containers with 16px radius
- **Row Types**:
  - Toggle: Glass pill switch (like iOS)
  - Disclosure: Chevron with glass background
  - Value: Right-aligned text in glass pill

**Nested Screens:**
- **Navigation**: Glass morphing between levels
- **Back Button**: Glass chevron that points to parent

### 9. Empty States

**No Apps:**
- **Illustration**: Abstract glass shapes floating
- **Message**: "Add your first app" 
- **CTA Button**: Pulsing glass "Add App" button

**No Transactions:**
- **Animation**: Glass particles gently floating
- **Message**: "No transactions yet"
- **Subtle**: Glass waves animating in background

### 10. Loading States

**Skeleton Screens:**
- **Glass Rectangles**: Animated shimmer effect
- **Pulse**: Opacity animates 40% to 60%
- **Timing**: 1.5s duration, ease-in-out

**Progress Indicators:**
- **Circular**: Glass ring that fills clockwise
- **Linear**: Glass bar with traveling highlight
- **Indeterminate**: Glass blob that morphs shapes

### 11. Toast Notifications

**Position**: Top of screen, below status bar
**Container**: Glass capsule, slides down with spring
**Contents**: [Icon] Message [Action?]
**Auto-dismiss**: 3s default, glass fades out
**Types**:
- Success: Green tinted glass
- Error: Red tinted glass  
- Info: Blue tinted glass
- Warning: Orange tinted glass

### 12. Action Menus

**Context Menu (Long Press):**
- **Origin**: Expands from touch point
- **Glass Container**: Adapts shape to content
- **Menu Items**: 
  - 44px height
  - Icon + Label layout
  - Glass separator between sections
  - Destructive actions in red tinted glass

**Bottom Action Sheet:**
- **Glass Sheet**: Slides up with options
- **Cancel Button**: Separate glass pill below actions
- **Destructive Actions**: Red text on glass

### 13. Input Components

**Text Fields:**
- **Container**: Glass inset, 12px radius
- **Height**: 44px standard, expands for multiline
- **Placeholder**: 40% white opacity
- **Focus State**: Glass rim glows with accent color
- **Clear Button**: Glass circle appears when filled

**Numeric Inputs:**
- **Stepper Buttons**: +/- in glass circles
- **Value Display**: Numbers morph between values
- **Quick Values**: Glass pills below (Max, Half, etc.)

**Switches/Toggles:**
- **Size**: 51x31px (iOS standard)
- **Knob**: Transforms to glass during drag
- **Track**: Glass fill animates left/right
- **State Change**: Haptic feedback

### 14. Onboarding Flow

**Welcome Screen:**
- **Hero Visual**: Animated glass layers parallax
- **Title**: Large, centered with glass backdrop
- **CTA**: Full-width glass button with arrow

**Feature Highlights:**
- **Cards**: Swipeable glass panels
- **Progress**: Glass dots at bottom
- **Skip Button**: Subtle glass pill, top-right

**Account Creation:**
- **Step Cards**: Glass panels that morph between
- **Progress Bar**: Glass fill animation
- **Security Checks**: Green glass checkmarks appear

### 15. Modal Dialogs

**Alert Style:**
- **Container**: Centered glass card, 280px width
- **Title**: 20px, weight 600
- **Message**: 16px, 80% opacity
- **Buttons**: Glass pills, side-by-side or stacked

**Full Modal:**
- **Background**: 80% black overlay with blur
- **Container**: Near full-screen glass sheet
- **Close Button**: Glass circle with ×, top-right
- **Content Scroll**: Glass fade at top/bottom edges

## Micro-Interactions & Details

### Touch Feedback
Every tappable element must provide:
1. **Visual**: Scale/brightness change
2. **Haptic**: Appropriate impact level
3. **Audio**: Subtle tap sound (optional)

### State Transitions
- **Duration**: 200-400ms for most transitions
- **Easing**: Spring physics or ease-out curves
- **Morphing**: Glass shapes never pop, always morph

### Glass Hierarchies
1. **Base Layer**: Background content (0.05 opacity)
2. **Content Layer**: Cards, cells (0.08 opacity)
3. **Navigation Layer**: Bars, tabs (0.10 opacity)
4. **Modal Layer**: Sheets, alerts (0.12 opacity)
5. **Critical Layer**: Confirmations (0.15 opacity)

### Responsive Behaviors
- **Landscape**: Two-column layouts where appropriate
- **iPad**: Floating panels instead of full-width sheets
- **Dynamic Type**: Scales gracefully with system settings
- **Reduced Motion**: Honors accessibility, removes parallax

Remember: Every element should feel like it's crafted from the same liquid glass material, responding fluidly to interaction and seamlessly morphing between states. The goal is an interface that feels alive, premium, and unmistakably Apple-inspired.