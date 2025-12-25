# GOLS UI Widget Components

## Component Overview

The GOLS UI Widget consists of several key components, each serving a specific function in the game information display interface.

## Core Components

### 1. Header Component

**Location**: Top of widget
**Size**: Full width × 30px height
**Purpose**: Branding and primary navigation

```html
<header class="gols-header">
  <div class="gols-logo-section">
    <img src="assets/gols-logo.svg" alt="Game On Live Studio" class="gols-logo-img">
  </div>
  <div class="gols-title">GAME INFO (DEMO MODE)</div>
  <button id="toggle-settings" class="gols-settings-btn">
    <i class="fas fa-cog"></i>
  </button>
</header>
```

**Features:**
- GOLS logo display
- Title with demo mode indicator
- Settings button (gear icon)

**CSS Classes:**
- `.gols-header`: Container styling
- `.gols-logo-section`: Logo positioning
- `.gols-title`: Typography and alignment
- `.gols-settings-btn`: Icon button styling

### 2. Control Panel Component

**Location**: Below header
**Size**: Full width × 60px height
**Purpose**: Event and stream selection

```html
<section class="gols-top-controls">
  <div class="gols-control-group">
    <label class="gols-control-label">EVENT</label>
    <select id="event-selector" class="gols-dropdown">
      <option value="">Select an event...</option>
    </select>
  </div>
  <div class="gols-control-group">
    <label class="gols-control-label">STREAM</label>
    <select id="stream-selector" class="gols-dropdown">
      <option value="">Select stream...</option>
    </select>
  </div>
</section>
```

**Features:**
- Event selection dropdown
- Stream selection dropdown
- Responsive two-column layout

**JavaScript Methods:**
- `populateEventSelector()`: Loads available events
- `populateStreamSelector()`: Loads available streams
- `handleEventChange()`: Processes event selection
- `handleStreamChange()`: Processes stream selection

### 3. Game Information Grid

**Location**: Center of widget
**Size**: Full width × 120px height
**Purpose**: Display game metadata

```html
<section class="gols-game-info">
  <div class="gols-info-item">
    <span class="gols-info-label">DATE:</span>
    <input type="text" class="gols-info-value" id="game-date" readonly>
  </div>
  <div class="gols-info-item">
    <span class="gols-info-label">LOCATION:</span>
    <input type="text" class="gols-info-value" id="game-location" readonly>
  </div>
  <!-- Additional info items -->
</section>
```

**Information Fields:**
- **DATE**: Event date (MM/DD/YYYY format)
- **LOCATION**: Venue or location name
- **GAME #**: Current game number in sequence
- **OFFICIAL START**: Scheduled start time
- **DIVISION**: League or division information
- **ACTUAL START**: Editable actual start time (highlighted)

**CSS Grid Layout:**
```css
.gols-game-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
}
```

### 4. Teams and Scores Component

**Location**: Center-bottom of widget
**Size**: Full width × 80px height
**Purpose**: Team names and score entry

```html
<section class="gols-teams-section">
  <div class="gols-teams-header">
    <div class="gols-team-label">TEAM 1</div>
    <div class="gols-score-label">SCORE</div>
    <div class="gols-team-label">TEAM 2</div>
    <div class="gols-score-label">SCORE</div>
  </div>
  <div class="gols-teams-inputs">
    <input type="text" class="gols-team-input" id="team1-name">
    <input type="text" class="gols-score-input" id="team1-score">
    <input type="text" class="gols-team-input" id="team2-name">
    <input type="text" class="gols-score-input" id="team2-score">
  </div>
</section>
```

**Features:**
- Four-column layout for teams and scores
- Editable team names
- Numeric score inputs
- Visual separation between teams

**Data Binding:**
- Team names populate from selected game data
- Scores update in real-time
- Input validation for numeric scores

### 5. Comments Component

**Location**: Below teams section
**Size**: Full width × 40px height
**Purpose**: Additional game notes

```html
<section class="gols-comments-section">
  <label class="gols-comments-label">COMMENTS:</label>
  <input type="text" class="gols-comments-input" id="game-comments">
</section>
```

**Features:**
- Single-line text input
- Auto-populates with game status information
- Fully editable for custom notes

### 6. Navigation Component

**Location**: Bottom of widget
**Size**: Full width × 40px height
**Purpose**: Game navigation controls

```html
<section class="gols-navigation">
  <button id="prev-game" class="gols-nav-btn">
    <i class="fas fa-chevron-left"></i>
    REVIEW PREV. GAME
  </button>
  <button id="next-game" class="gols-nav-btn">
    SAVE & NEXT GAME
    <i class="fas fa-chevron-right"></i>
  </button>
</section>
```

**Features:**
- Previous/Next game navigation
- Buttons disable when at boundaries
- Visual feedback for navigation state

**JavaScript Logic:**
```javascript
navigateGame(direction) {
  const newIndex = this.currentGameIndex + direction;
  if (newIndex >= 0 && newIndex < this.currentEvent.games.length) {
    this.currentGameIndex = newIndex;
    this.updateGameDisplay();
  }
}
```

## Overlay Components

### Settings Panel

**Trigger**: Gear icon in header
**Type**: Modal overlay
**Purpose**: Configuration options

```html
<div class="gols-settings-overlay" id="settings-overlay">
  <div class="gols-settings-panel">
    <div class="gols-settings-header">
      <h3>Settings</h3>
      <button id="close-settings" class="gols-close-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="gols-settings-content">
      <!-- Settings form -->
    </div>
  </div>
</div>
```

**Features:**
- Modal overlay with backdrop
- Demo configuration options
- Debug mode toggle
- Auto-refresh settings

### Notifications System

**Location**: Floating notifications area
**Type**: Toast-style messages
**Purpose**: User feedback

```javascript
showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `gols-notification gols-notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${iconClass}"></i>
    <span>${message}</span>
    <button class="gols-notification-close">&times;</button>
  `;
  // Auto-dismiss after 5 seconds
}
```

**Notification Types:**
- **Success**: Green, check icon
- **Info**: Blue, info icon  
- **Warning**: Orange, exclamation icon
- **Error**: Red, warning icon

## Component Interactions

### Data Flow Between Components

1. **Event Selection** → Updates all game information fields
2. **Game Navigation** → Refreshes teams, scores, and metadata
3. **Score Changes** → Triggers save notifications
4. **Settings Changes** → Affects widget behavior globally

### Event System

```javascript
// Component communication through direct method calls
handleEventChange() {
  this.updateGameDisplay();
  this.updateGameNavigation();
  this.showNotification('success', 'Event loaded');
}
```

## Responsive Behavior

### Fixed Dimensions

All components are designed for the fixed 450×380px canvas:

```css
#widget-container {
  width: 450px;
  height: 380px;
  overflow: hidden;
}
```

### Component Sizing

| Component | Height | Flex/Fixed |
|-----------|--------|------------|
| Header | 30px | Fixed |
| Controls | 60px | Fixed |
| Game Info | 120px | Fixed |
| Teams | 80px | Fixed |
| Comments | 40px | Fixed |
| Navigation | 40px | Fixed |
| **Total** | **370px** | *10px margin* |

## Styling Patterns

### CSS Class Naming

```css
.gols-{component}           /* Component container */
.gols-{component}-{element} /* Element within component */
.gols-{component}--{state}  /* Component state modifier */
```

### Color Coding

- **Labels**: Dark gray (`#3D4145`)
- **Inputs**: White background with gray borders
- **Highlights**: Cardinal red (`#C62128`) for editable fields
- **Navigation**: Green (`#37605F`) for action buttons

### Typography Scale

- **Labels**: 10px, bold, uppercase
- **Inputs**: 12px, regular weight
- **Buttons**: 11px, medium weight
- **Title**: 14px, bold, uppercase

## Accessibility Features

### ARIA Labels

```html
<button id="toggle-settings" 
        class="gols-settings-btn"
        aria-label="Open settings panel">
  <i class="fas fa-cog"></i>
</button>
```

### Keyboard Navigation

- Tab order follows logical flow
- Enter key activates buttons
- Escape closes modal dialogs
- Arrow keys navigate between inputs

### Screen Reader Support

- Semantic HTML structure
- Descriptive alt text for images
- Form labels properly associated
- Status announcements for notifications
