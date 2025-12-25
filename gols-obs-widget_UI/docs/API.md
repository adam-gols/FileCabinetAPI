# GOLS UI Widget - JavaScript API Reference

## 🎯 Overview

The GOLS UI Widget exposes a clean JavaScript API through the global `window.golsUI` object. This API provides programmatic access to all widget functionality for integration, debugging, and automation.

## 🔗 Global Access

```javascript
// Access the widget instance (available after DOM load)
const widget = window.golsUI;

// Check if widget is ready
if (widget && widget.isInitialized) {
  // Widget is ready to use
}
```

## 📚 Core API Methods

### UIManager Class

The main controller class that manages all widget functionality.

#### Constructor
```javascript
new UIManager()
```
Creates a new widget instance with default state.

#### initialize()
```javascript
async initialize()
```
**Purpose**: Initializes the widget completely
**Returns**: `Promise<void>`
**Usage**:
```javascript
const manager = new UIManager();
await manager.initialize();
```

#### toggleSettings(show)
```javascript
toggleSettings(show: boolean | undefined)
```
**Purpose**: Controls the settings panel visibility
**Parameters**:
- `show` (boolean, optional): `true` to show, `false` to hide, `undefined` to toggle

**Usage**:
```javascript
widget.toggleSettings(true);   // Show settings panel
widget.toggleSettings(false);  // Hide settings panel  
widget.toggleSettings();       // Toggle current state
```

#### navigateGame(direction)
```javascript
navigateGame(direction: number)
```
**Purpose**: Navigate between games in the current event
**Parameters**:
- `direction` (number): `1` for next game, `-1` for previous game

**Returns**: `boolean` - `true` if navigation occurred, `false` if at boundary

**Usage**:
```javascript
widget.navigateGame(1);   // Next game
widget.navigateGame(-1);  // Previous game
```

#### updateDisplay()
```javascript
updateDisplay()
```
**Purpose**: Refreshes all UI elements with current data
**Usage**:
```javascript
widget.updateDisplay(); // Refresh entire widget display
```

#### loadEvent(eventId)
```javascript
async loadEvent(eventId: string)
```
**Purpose**: Loads a specific event and its games
**Parameters**:
- `eventId` (string): The ID of the event to load

**Returns**: `Promise<void>`
**Usage**:
```javascript
await widget.loadEvent('bball-2024');
```

## 📊 State Properties

### Read-Only Properties

#### isInitialized
```javascript
widget.isInitialized // boolean
```
Indicates whether the widget has completed initialization.

#### currentEvent
```javascript
widget.currentEvent // EventData | null
```
The currently selected event object:
```javascript
{
  id: 'bball-2024',
  name: 'Basketball Championship 2024',
  sport: 'basketball',
  games: Array<GameData>
}
```

#### currentGameIndex
```javascript
widget.currentGameIndex // number
```
The index of the currently displayed game within the current event.

#### currentGame
```javascript
widget.currentGame // GameData | null
```
The currently displayed game object:
```javascript
{
  id: 'game-001',
  team1: { name: 'Lakers', score: 98 },
  team2: { name: 'Warriors', score: 102 },
  status: 'completed',
  date: '2024-01-15',
  actualStartTime: '19:30',
  officialStartTime: '19:00',
  location: 'Staples Center',
  comments: 'Amazing game with overtime!'
}
```

## 🎮 Event System

### Custom Events

The widget dispatches custom events for integration:

#### gols-game-changed
```javascript
document.addEventListener('gols-game-changed', (event) => {
  console.log('Game changed:', event.detail);
  // event.detail = { previousGame, currentGame, gameIndex }
});
```

#### gols-event-changed
```javascript
document.addEventListener('gols-event-changed', (event) => {
  console.log('Event changed:', event.detail);
  // event.detail = { previousEvent, currentEvent }
});
```

#### gols-settings-toggled
```javascript
document.addEventListener('gols-settings-toggled', (event) => {
  console.log('Settings toggled:', event.detail);
  // event.detail = { isVisible: boolean }
});
```

## 🔧 Service Layer API

### EventService
```javascript
// Access through widget
const eventService = widget.services.eventService;

// Get all available events
const events = await eventService.getEvents();

// Get games for a specific event  
const games = await eventService.getGamesByEvent(eventId);
```

### GameService
```javascript
const gameService = widget.services.gameService;

// Get game by ID
const game = await gameService.getGameById(gameId);

// Update game data
await gameService.updateGame(gameId, gameData);
```

### SettingsService
```javascript
const settingsService = widget.services.settingsService;

// Get current settings
const settings = await settingsService.getSettings();

// Update settings
await settingsService.updateSettings({
  debugMode: true,
  autoRefresh: false
});
```

## 🎨 UI Component Access

### Direct DOM Access
```javascript
// Get widget container
const container = document.getElementById('gols-widget');

// Get settings overlay
const overlay = document.getElementById('settings-overlay');

// Get form elements
const eventSelect = document.getElementById('event-select');
const streamSelect = document.getElementById('stream-select');
```

### Programmatic UI Updates
```javascript
// Update team names
widget.updateTeamName(1, 'New Team Name');
widget.updateTeamName(2, 'Other Team');

// Update scores  
widget.updateScore(1, 105);
widget.updateScore(2, 98);

// Update game comments
widget.updateComments('Final score after overtime!');
```

## 🛠️ Debug and Development API

### Debug Methods
```javascript
// Enable debug logging
widget.setDebugMode(true);

// Get current widget state
const state = widget.getDebugState();
console.log(state);

// Force refresh demo data
widget.refreshDemoData();

// Reset widget to initial state
widget.reset();
```

### Performance Monitoring
```javascript
// Get performance metrics
const metrics = widget.getPerformanceMetrics();
console.log(metrics);
// Returns: { loadTime, renderTime, memoryUsage }
```

### Error Handling
```javascript
// Listen for widget errors
document.addEventListener('gols-error', (event) => {
  console.error('Widget error:', event.detail);
  // event.detail = { error: Error, context: string }
});
```

## 📝 Data Types

### EventData Interface
```typescript
interface EventData {
  id: string;           // Unique identifier
  name: string;         // Display name
  sport: string;        // Sport type
  date: string;         // Event date
  venue?: string;       // Event venue
  games: GameData[];    // Associated games
}
```

### GameData Interface
```typescript
interface GameData {
  id: string;                    // Unique identifier
  team1: TeamData;               // First team
  team2: TeamData;               // Second team  
  status: GameStatus;            // Game status
  date: string;                  // Game date
  officialStartTime?: string;    // Official start time
  actualStartTime?: string;      // Actual start time
  location?: string;             // Game location
  comments?: string;             // Additional notes
}
```

### TeamData Interface
```typescript
interface TeamData {
  name: string;         // Team name
  score: number;        // Current score
  logo?: string;        // Team logo URL
}
```

### GameStatus Type
```typescript
type GameStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
```

## 🔗 Integration Examples

### OBS Integration
```javascript
// Wait for widget to load in OBS
window.addEventListener('load', () => {
  if (window.golsUI) {
    // Widget is ready
    console.log('GOLS Widget loaded in OBS');
  }
});
```

### External Control
```javascript
// Control widget from parent window
function nextGame() {
  if (window.golsUI) {
    const success = window.golsUI.navigateGame(1);
    if (!success) {
      alert('No more games in this event');
    }
  }
}

function openSettings() {
  window.golsUI?.toggleSettings(true);
}
```

### Data Integration
```javascript
// Replace mock data with real API
class RealEventService {
  async getEvents() {
    const response = await fetch('/api/events');
    return response.json();
  }
  
  async getGamesByEvent(eventId) {
    const response = await fetch(`/api/events/${eventId}/games`);
    return response.json();
  }
}

// Replace the mock service
widget.services.eventService = new RealEventService();
```

## 🚨 Error Handling

### Common Error Scenarios
```javascript
try {
  await widget.loadEvent('invalid-event');
} catch (error) {
  if (error.code === 'EVENT_NOT_FOUND') {
    // Handle missing event
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network issues  
  }
}
```

### Error Recovery
```javascript
// Widget self-recovery
widget.addEventListener('error', () => {
  console.log('Widget encountered error, attempting recovery...');
  widget.reset();
});
```

## 🎯 Best Practices

### Initialization Check
```javascript
function safeWidgetCall(callback) {
  if (window.golsUI && window.golsUI.isInitialized) {
    callback(window.golsUI);
  } else {
    console.warn('Widget not yet initialized');
  }
}
```

### Event Cleanup
```javascript
// Clean up event listeners when done
function cleanup() {
  document.removeEventListener('gols-game-changed', handler);
  document.removeEventListener('gols-event-changed', handler);
}
```

### Performance Optimization
```javascript
// Batch UI updates
widget.beginBatchUpdate();
widget.updateTeamName(1, 'Team A');
widget.updateScore(1, 100);
widget.endBatchUpdate(); // Single render
```

This API provides complete programmatic control over the GOLS UI Widget, enabling seamless integration into any application or broadcast environment. 🚀
