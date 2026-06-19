---
name: Ring Flow
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  card-padding: 20px
---

## Brand & Style
The design system is engineered for high-stakes, real-time martial arts tournament management. It prioritizes **utility, authority, and rapid cognition**. The aesthetic is **Corporate / Modern** with a focus on data density without the clutter. 

The target audience consists of tournament directors, referees, and logistics coordinators who need to make split-second decisions in loud, high-activity environments. Consequently, the UI evokes a sense of **command and control**, utilizing high-contrast elements to ensure visibility on large arena displays or handheld tablets under various lighting conditions.

Key pillars:
- **Immediate Legibility:** Information hierarchy is strictly enforced through weight and color.
- **Operational Stability:** A structured grid and grounded color palette provide a sense of reliability.
- **Urgency Awareness:** High-contrast accent colors are reserved for actionable status changes and critical time-sensitive data.

## Colors
This design system utilizes a high-contrast palette designed for "tournament floor" visibility. 

- **Primary (Deep Navy):** Used for global navigation, headers, and primary text to establish authority.
- **Secondary (Action Cobalt):** Dedicated to primary actions, interactive states, and active selection.
- **Accent (Action Red):** Reserved for high-urgency notifications or "Ring Stopped" states.
- **Background (Slate Tint):** A very light grey (#F8FAFC) is used instead of pure white to reduce eye strain during long hours of monitoring while maintaining a clean, professional canvas.
- **Status Tints:** Semantic colors (Green, Amber, Red) are used primarily for ring statuses and match progress, utilizing highly saturated hues to ensure they are distinguishable from a distance.

## Typography
**Inter** is the workhorse of this design system, chosen for its exceptional legibility and neutral, systematic tone. **JetBrains Mono** is introduced as a secondary font for data points (timer values, weight classes, bracket IDs) to prevent character jumping during real-time updates and to distinguish raw data from UI labels.

- **Headlines:** Use Bold weights for immediate recognition of Ring numbers or Division names.
- **Data Points:** All numerical values and match IDs should use the `data-mono` style to ensure alignment and clarity in high-density tables.
- **Labels:** Small, uppercase labels are used to categorize data (e.g., "NEXT UP", "MAT 4") without competing with the primary data values.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop dashboards and a **single-column stack** for mobile views. 

- **Density:** A tight 4px baseline grid is used to allow for high data density.
- **Ring Cards:** In the command center view, Ring Cards should follow a flexible masonry or grid layout, allowing 3-4 rings per row on desktop and 1 per row on mobile.
- **Safe Areas:** Generous exterior margins (32px on desktop) prevent the UI from feeling cramped against screen edges, while internal card padding remains efficient (20px) to maximize the amount of visible match data.

## Elevation & Depth
To maintain a high-utility, professional aesthetic, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-contrast outlines**.

- **Level 0 (Background):** Slate Tint (#F8FAFC).
- **Level 1 (Cards/Panels):** Pure White (#FFFFFF) with a 1px solid border (#E2E8F0).
- **Level 2 (Modals/Popovers):** Pure White with a subtle, crisp shadow (0px 4px 6px -1px rgba(15, 23, 42, 0.1)) to indicate focus.
- **Interactions:** Drag-and-drop handles and active ring cards use a 2px Primary Cobalt border to indicate "focus" or "selected" states rather than increasing elevation.

## Shapes
The design system uses a **Soft (1)** roundedness profile (4px radius). This provides a professional, "software-as-a-tool" feel that is more efficient for data-heavy layouts than pill-shapes. Large components like Ring Cards or Modals may use `rounded-lg` (8px) to soften the overall interface, but interactive elements like inputs and chips remain sharp and precise.

## Components
- **Ring Cards:** The primary UI unit. Features a status header (colored by status), match timer in `data-mono`, and current/on-deck competitor names. Includes a clear drag-handle icon for reordering rings.
- **Status Badges:** Small, high-contrast pills. "Running" (Success Green), "Paused" (Amber), "Interruption" (Error Red). Text is always `label-caps` for maximum punch.
- **Action Buttons:** Primary buttons use Deep Navy with white text. Secondary buttons use a Slate ghost style (outline only).
- **Progress Bars:** Thin 4px bars inside Ring Cards indicating match duration. Use a neutral grey background with the Status color filling the progress.
- **Activity Feed:** A vertical list of timestamped events (e.g., "Match 104 Started"). Uses `body-sm` and `data-mono` for time stamps.
- **Input Fields:** Squared corners (4px), 1px Slate border, 16px internal padding. Focus state is a 2px Cobalt outline.
- **Drag-and-Drop Handles:** Vertical "grip" icons (6 dots) used on match list items to allow quick bracket reordering.