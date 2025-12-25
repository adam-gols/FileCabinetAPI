# GOLS UI Widget Styling Guide

## Overview

The GOLS UI Widget uses a modular CSS architecture with custom properties for easy theming and maintenance. All styles are contained within the widget to prevent conflicts with parent pages.

## CSS Architecture

### File Organization

```
src/styles/
├── main.css       # Base styles, variables, utilities
├── components.css # Generic UI component styles
├── game-info.css  # Game-specific display styles
└── compact.css    # 450x380px layout optimization
```

### Loading Order

1. **main.css**: Foundation styles and CSS variables
2. **components.css**: Reusable component patterns
3. **game-info.css**: Game-specific layouts
4. **compact.css**: Size optimizations (overrides previous styles)

## Design System

### Brand Colors

```css
:root {
  /* Primary Palette */
  --gols-cardinal-red: #C62128;    /* Brand primary */
  --gols-black: #000000;           /* Text primary */
  --gols-pumice-grey: #C7C9C7;     /* Borders, disabled */
  --gols-gallery-grey: #F0EFEF;    /* Backgrounds */
  
  /* Secondary Palette */
  --gols-william-green: #37605F;    /* Success, actions */
  --gols-zodiac-blue: #0F1C41;     /* Headers, accents */
  --gols-picton-blue: #4DC7E4;     /* Info, highlights */
}
```

### Usage Guidelines

- **Cardinal Red**: Primary brand elements, error states, focus indicators
- **William Green**: Success states, action buttons, positive feedback
- **Zodiac Blue**: Headers, navigation, professional accents
- **Gallery Grey**: Background areas, disabled states
- **Pumice Grey**: Borders, dividers, subtle text

### Typography System

```css
:root {
  --gols-font-primary: 'Roboto', 'Arial', sans-serif;
  --gols-font-secondary: 'Oswald', 'Arial Black', sans-serif;
}
```

#### Font Hierarchy

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| Widget Title | Oswald | 14px | Bold | Header branding |
| Labels | Roboto | 10px | Bold | Field labels |
| Inputs | Roboto | 12px | Regular | Data entry |
| Buttons | Roboto | 11px | Medium | Actions |
| Notifications | Roboto | 12px | Regular | Messages |

### Spacing Scale

```css
:root {
  --gols-spacing-xs: 4px;   /* Tight spacing */
  --gols-spacing-sm: 8px;   /* Standard gap */
  --gols-spacing-md: 16px;  /* Section separation */
  --gols-spacing-lg: 24px;  /* Major sections */
  --gols-spacing-xl: 32px;  /* Page-level spacing */
}
```

### Border Radius

```css
:root {
  --gols-radius-sm: 4px;    /* Inputs, buttons */
  --gols-radius-md: 8px;    /* Cards, panels */
  --gols-radius-lg: 12px;   /* Modal dialogs */
}
```

## Component Styles

### Header Component

```css
.gols-header {
  background: linear-gradient(135deg, 
    var(--gols-zodiac-blue) 0%, 
    var(--gols-cardinal-red) 100%);
  color: white;
  height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--gols-spacing-sm);
}

.gols-title {
  font-family: var(--gols-font-secondary);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### Input Components

```css
.gols-input {
  font-family: var(--gols-font-primary);
  font-size: 12px;
  padding: var(--gols-spacing-xs) var(--gols-spacing-sm);
  border: 1px solid var(--gols-pumice-grey);
  border-radius: var(--gols-radius-sm);
  background-color: white;
  color: var(--gols-black);
  min-height: 28px;
}

.gols-input:focus {
  border-color: var(--gols-cardinal-red);
  box-shadow: 0 0 0 1px var(--gols-cardinal-red);
  outline: none;
}

.gols-input.highlight {
  background-color: #FFF9C4;
  border-color: var(--gols-cardinal-red);
}
```

### Button Components

```css
.gols-button {
  font-family: var(--gols-font-primary);
  font-size: 11px;
  font-weight: 500;
  padding: var(--gols-spacing-xs) var(--gols-spacing-sm);
  border: none;
  border-radius: var(--gols-radius-sm);
  cursor: pointer;
  transition: all 150ms ease-in-out;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gols-spacing-xs);
}

.gols-button-primary {
  background-color: var(--gols-cardinal-red);
  color: white;
}

.gols-button-primary:hover:not(:disabled) {
  background-color: #A31C23;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## Layout System

### Grid Layout (Game Info)

```css
.gols-game-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: var(--gols-spacing-sm);
  padding: var(--gols-spacing-sm);
}

.gols-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

### Flexbox Layout (Teams)

```css
.gols-teams-inputs {
  display: flex;
  gap: var(--gols-spacing-sm);
  align-items: center;
}

.gols-team-input {
  flex: 2;
  min-width: 0;
}

.gols-score-input {
  flex: 1;
  text-align: center;
}
```

## Compact Optimizations

### Size Constraints

```css
#gols-widget {
  width: 100%;
  height: 100%;
  background: var(--gols-white);
  border: 1px solid var(--gols-gallery-grey);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  font-size: 12px; /* Base font size reduced */
  contain: layout style paint;
  isolation: isolate;
}
```

### Text Scaling

```css
/* Compact-specific font sizes */
.gols-compact-header .gols-logo-text {
  font-size: 10px;
}

.gols-control-label {
  font-size: 9px;
  line-height: 1.2;
}

.gols-info-label {
  font-size: 8px;
  font-weight: 600;
}
```

## State Management

### Interactive States

```css
/* Hover states */
.gols-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--gols-shadow-md);
}

/* Focus states */
.gols-input:focus {
  border-color: var(--gols-cardinal-red);
  box-shadow: 0 0 0 1px var(--gols-cardinal-red);
}

/* Disabled states */
.gols-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Status Indicators

```css
.gols-status {
  display: inline-flex;
  align-items: center;
  gap: var(--gols-spacing-xs);
  font-size: 10px;
  font-weight: 500;
  padding: 2px var(--gols-spacing-xs);
  border-radius: var(--gols-radius-sm);
}

.gols-status::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
}

.gols-status-connected {
  color: var(--gols-william-green);
  background-color: rgba(55, 96, 95, 0.1);
}
```

## Animation System

### Transitions

```css
:root {
  --gols-transition-fast: 150ms ease-in-out;
  --gols-transition-normal: 250ms ease-in-out;
  --gols-transition-slow: 350ms ease-in-out;
}
```

### Notification Animations

```css
.gols-notification {
  animation: gols-slide-in 0.3s ease-out;
}

@keyframes gols-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Loading States

```css
.gols-loading::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid var(--gols-gallery-grey);
  border-top: 2px solid var(--gols-cardinal-red);
  border-radius: 50%;
  animation: gols-spin 1s linear infinite;
}

@keyframes gols-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## CSS Isolation

### Widget Containment

```css
#gols-widget {
  /* Prevent style bleeding */
  contain: layout style paint;
  isolation: isolate;
}

/* Reset all child elements */
#gols-widget * {
  box-sizing: border-box;
}
```

### Scoped Styling

All CSS classes use the `gols-` prefix to prevent conflicts:

```css
.gols-component {}      /* Safe */
.component {}           /* Potential conflict */
```

## Customization Points

### Theme Variables

Override any custom property:

```css
:root {
  --gols-cardinal-red: #YOUR_BRAND_COLOR;
  --gols-font-primary: 'Your Font', sans-serif;
}
```

### Component Overrides

```css
/* Extend existing components */
.gols-button-custom {
  composes: gols-button gols-button-primary;
  background: linear-gradient(45deg, red, blue);
}
```

### Responsive Adjustments

```css
/* For different container sizes */
@container (max-width: 400px) {
  .gols-teams-inputs {
    flex-direction: column;
  }
}
```

## Browser Compatibility

### CSS Features Used

- **CSS Custom Properties**: Variables for theming
- **CSS Grid**: Layout for game information
- **Flexbox**: Component alignment
- **CSS Transforms**: Hover animations
- **CSS Gradients**: Header backgrounds

### Fallbacks

```css
/* Fallback for CSS custom properties */
.gols-button-primary {
  background-color: #C62128; /* Fallback */
  background-color: var(--gols-cardinal-red);
}
```

## Performance Optimizations

### CSS Containment

```css
#gols-widget {
  contain: layout style paint;
  will-change: transform;
}
```

### Efficient Selectors

```css
/* Good: Direct class selectors */
.gols-button {}

/* Avoid: Deep nesting */
.gols-widget .section .component .element {}
```

### Minimal Repaints

```css
/* Use transforms for animations */
.gols-button:hover {
  transform: translateY(-1px); /* GPU accelerated */
  /* avoid: top: -1px; */ /* Causes layout */
}
```
