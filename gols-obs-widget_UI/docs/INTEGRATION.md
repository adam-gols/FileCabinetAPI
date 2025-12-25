# GOLS UI Widget Integration Guide

## Overview

This guide covers various ways to integrate the GOLS UI Widget into different environments and applications. The widget is designed to be flexible and work in multiple deployment scenarios.

## Basic Integration

### Direct HTML Include

The simplest way to use the widget is to open `index.html` directly:

```html
<!-- Your existing page -->
<html>
<head>
  <title>My Application</title>
</head>
<body>
  <h1>Game Management Dashboard</h1>
  
  <!-- Widget iframe -->
  <iframe 
    src="path/to/gols-ui-widget/index.html" 
    width="450" 
    height="380"
    frameborder="0"
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  </iframe>
</body>
</html>
```

### Inline Integration

For more control, embed the widget directly in your page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App with GOLS Widget</title>
  
  <!-- External dependencies -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Oswald:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- Widget styles -->
  <link rel="stylesheet" href="gols-ui-widget/src/styles/main.css">
  <link rel="stylesheet" href="gols-ui-widget/src/styles/components.css">
  <link rel="stylesheet" href="gols-ui-widget/src/styles/game-info.css">
  <link rel="stylesheet" href="gols-ui-widget/src/styles/compact.css">
  
  <style>
    #my-widget-container {
      width: 450px;
      height: 380px;
      margin: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="my-widget-container">
    <div id="gols-widget">
      <div class="gols-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading...</span>
      </div>
    </div>
  </div>

  <!-- Widget JavaScript -->
  <script src="gols-ui-widget/src/js/mock-services.js"></script>
  <script src="gols-ui-widget/src/js/demo-data.js"></script>
  <script src="gols-ui-widget/src/js/ui-manager.js"></script>
  <script src="gols-ui-widget/src/js/main.js"></script>
</body>
</html>
```

## OBS Studio Integration

### Browser Source Setup

1. **Add Browser Source**:
   - Right-click in Sources → Add → Browser Source
   - Name it "GOLS Widget"

2. **Configure Source**:
   ```
   URL: file:///path/to/gols-ui-widget/index.html
   Width: 450
   Height: 380
   FPS: 30
   ```

3. **Advanced Properties**:
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active
   - Custom CSS (optional):
   ```css
   body { 
     background: transparent !important; 
     margin: 0;
   }
   ```

### Scene Setup

```
Scene: "Game Overlay"
├── Background Video/Image
├── GOLS Widget (450x380)
├── Team Logos (if needed)
└── Additional Graphics
```

### Position the Widget

- **Top-left corner**: Good for compact info display
- **Bottom-right**: Minimizes overlap with main action
- **Center-bottom**: Scoreboard-style placement

### OBS Filters

Add filters for enhanced presentation:

1. **Color Correction**: Adjust brightness/contrast
2. **Chroma Key**: If using green screen
3. **Crop/Pad**: Fine-tune positioning

## Web Application Integration

### React Integration

```jsx
// components/GOLSWidget.jsx
import React, { useEffect, useRef, useState } from 'react';

const GOLSWidget = ({ eventId, onGameChange }) => {
  const containerRef = useRef(null);
  const [uiManager, setUiManager] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load widget scripts dynamically
    const loadWidget = async () => {
      if (!window.UIManager) {
        await loadScript('/gols-ui-widget/src/js/mock-services.js');
        await loadScript('/gols-ui-widget/src/js/demo-data.js');
        await loadScript('/gols-ui-widget/src/js/ui-manager.js');
      }

      if (containerRef.current) {
        const manager = new window.UIManager();
        await manager.initialize();
        setUiManager(manager);
        setIsLoaded(true);
      }
    };

    loadWidget();
  }, []);

  useEffect(() => {
    if (uiManager && eventId) {
      const event = window.mockEvents.find(e => e.id === eventId);
      if (event) {
        uiManager.currentEvent = event;
        uiManager.updateGameDisplay();
      }
    }
  }, [uiManager, eventId]);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  return (
    <div className="gols-widget-container">
      <div ref={containerRef} id="gols-widget" />
      {!isLoaded && <div>Loading GOLS Widget...</div>}
    </div>
  );
};

export default GOLSWidget;
```

```css
/* components/GOLSWidget.css */
.gols-widget-container {
  width: 450px;
  height: 380px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background: white;
}

#gols-widget {
  width: 100%;
  height: 100%;
}
```

### Vue.js Integration

```vue
<!-- components/GOLSWidget.vue -->
<template>
  <div class="gols-widget-wrapper">
    <div ref="widgetContainer" id="gols-widget"></div>
    <div v-if="!loaded" class="loading-overlay">
      Loading Widget...
    </div>
  </div>
</template>

<script>
export default {
  name: 'GOLSWidget',
  props: {
    selectedEventId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      uiManager: null,
      loaded: false
    };
  },
  async mounted() {
    await this.initializeWidget();
  },
  watch: {
    selectedEventId(newEventId) {
      this.selectEvent(newEventId);
    }
  },
  methods: {
    async initializeWidget() {
      try {
        // Load styles
        this.loadStyles();
        
        // Initialize UI
        this.uiManager = new UIManager();
        await this.uiManager.initialize();
        this.loaded = true;
        
        this.$emit('widget-loaded');
      } catch (error) {
        console.error('Failed to initialize widget:', error);
        this.$emit('widget-error', error);
      }
    },
    
    loadStyles() {
      const stylesheets = [
        'main.css',
        'components.css', 
        'game-info.css',
        'compact.css'
      ];
      
      stylesheets.forEach(stylesheet => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/gols-ui-widget/src/styles/${stylesheet}`;
        document.head.appendChild(link);
      });
    },
    
    selectEvent(eventId) {
      if (this.uiManager && eventId) {
        const event = window.mockEvents.find(e => e.id === eventId);
        if (event) {
          this.uiManager.currentEvent = event;
          this.uiManager.currentGameIndex = 0;
          this.uiManager.updateGameDisplay();
          this.$emit('event-selected', event);
        }
      }
    }
  }
};
</script>

<style scoped>
.gols-widget-wrapper {
  width: 450px;
  height: 380px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.9);
  font-family: 'Roboto', sans-serif;
  color: #666;
}
</style>
```

### Angular Integration

```typescript
// components/gols-widget/gols-widget.component.ts
import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-gols-widget',
  template: `
    <div class="gols-widget-container">
      <div #widgetContainer id="gols-widget"></div>
      <div *ngIf="!loaded" class="loading-overlay">
        Loading GOLS Widget...
      </div>
    </div>
  `,
  styleUrls: ['./gols-widget.component.scss']
})
export class GOLSWidgetComponent implements OnInit {
  @Input() eventId: string | null = null;
  @Output() gameChanged = new EventEmitter<any>();
  @ViewChild('widgetContainer', { static: true }) widgetContainer!: ElementRef;

  private uiManager: any = null;
  loaded = false;

  ngOnInit() {
    this.loadWidget();
  }

  ngOnChanges(changes: any) {
    if (changes.eventId && this.uiManager) {
      this.selectEvent(changes.eventId.currentValue);
    }
  }

  private async loadWidget() {
    try {
      // Load scripts
      await this.loadScript('/gols-ui-widget/src/js/mock-services.js');
      await this.loadScript('/gols-ui-widget/src/js/demo-data.js');
      await this.loadScript('/gols-ui-widget/src/js/ui-manager.js');

      // Initialize
      this.uiManager = new (window as any).UIManager();
      await this.uiManager.initialize();
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load widget:', error);
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private selectEvent(eventId: string) {
    if (this.uiManager && eventId) {
      const event = (window as any).mockEvents.find((e: any) => e.id === eventId);
      if (event) {
        this.uiManager.currentEvent = event;
        this.uiManager.updateGameDisplay();
        this.gameChanged.emit(event);
      }
    }
  }
}
```

## Electron Integration

### Main Process Setup

```javascript
// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the widget
  mainWindow.loadFile('gols-ui-widget/index.html');
}

app.whenReady().then(createWindow);
```

### Widget Window

```javascript
// widget-window.js
const { BrowserWindow } = require('electron');
const path = require('path');

function createWidgetWindow() {
  const widgetWindow = new BrowserWindow({
    width: 450,
    height: 380,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  widgetWindow.loadFile('gols-ui-widget/index.html');
  
  return widgetWindow;
}

module.exports = { createWidgetWindow };
```

## Data Integration

### Replace Mock Services

Create real service implementations:

```javascript
// services/real-event-service.js
class RealEventService {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getEvents() {
    const response = await fetch(`${this.apiBaseUrl}/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  }

  async getGames(eventId) {
    const response = await fetch(`${this.apiBaseUrl}/events/${eventId}/games`);
    if (!response.ok) throw new Error('Failed to fetch games');
    return response.json();
  }

  async updateScore(gameId, homeScore, awayScore) {
    const response = await fetch(`${this.apiBaseUrl}/games/${gameId}/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeScore, awayScore })
    });
    if (!response.ok) throw new Error('Failed to update score');
    return response.json();
  }
}
```

### Integration Example

```javascript
// Replace mock data with real service
const eventService = new RealEventService('/api');

// Modified UI Manager initialization
class RealUIManager extends UIManager {
  async loadEvents() {
    try {
      const events = await eventService.getEvents();
      this.populateEventSelector(events);
    } catch (error) {
      this.showNotification('error', 'Failed to load events');
    }
  }

  async handleScoreChange(gameId, homeScore, awayScore) {
    try {
      await eventService.updateScore(gameId, homeScore, awayScore);
      this.showNotification('success', 'Score updated');
    } catch (error) {
      this.showNotification('error', 'Failed to update score');
    }
  }
}
```

## Customization Examples

### Custom Branding

```css
/* custom-branding.css */
:root {
  --gols-cardinal-red: #YOUR_PRIMARY_COLOR;
  --gols-william-green: #YOUR_SECONDARY_COLOR;
  --gols-font-primary: 'Your Font', sans-serif;
}

.gols-title::after {
  content: ' - YOUR BRAND';
  font-size: 10px;
  opacity: 0.7;
}
```

### Additional Fields

```javascript
// Extended template with custom fields
createCustomTemplateContent() {
  return `
    ${this.createOriginalTemplateContent()}
    
    <!-- Custom fields -->
    <section class="custom-fields">
      <div class="gols-info-item">
        <span class="gols-info-label">REFEREE:</span>
        <input type="text" class="gols-info-value" id="game-referee">
      </div>
    </section>
  `;
}
```

### Event Hooks

```javascript
// Custom event handling
class ExtendedUIManager extends UIManager {
  handleGameDataChange() {
    super.handleGameDataChange();
    
    // Custom logic
    this.saveToLocalStorage();
    this.notifyParentWindow();
    this.updateExternalAPI();
  }

  saveToLocalStorage() {
    const gameData = this.getCurrentGameData();
    localStorage.setItem('currentGame', JSON.stringify(gameData));
  }

  notifyParentWindow() {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'GOLS_GAME_UPDATED',
        data: this.getCurrentGameData()
      }, '*');
    }
  }
}
```

## Deployment Strategies

### Static File Hosting

1. **Upload to web server**: Copy entire `gols-ui-widget` folder
2. **Set MIME types**: Ensure `.js` and `.css` files served correctly
3. **HTTPS required**: For OBS Browser Sources

### CDN Distribution

```html
<!-- Load from CDN -->
<link rel="stylesheet" href="https://cdn.example.com/gols-ui-widget/styles/main.css">
<script src="https://cdn.example.com/gols-ui-widget/js/ui-manager.js"></script>
```

### Docker Container

```dockerfile
FROM nginx:alpine
COPY gols-ui-widget/ /usr/share/nginx/html/
EXPOSE 80
```

## Troubleshooting

### Common Issues

1. **Widget doesn't load**:
   - Check file paths are correct
   - Verify all CSS/JS files are accessible
   - Check browser console for errors

2. **Styles not applying**:
   - Ensure CSS files load before JavaScript
   - Check for conflicting parent styles
   - Verify container has correct ID

3. **OBS Browser Source issues**:
   - Use `file://` protocol for local files
   - Set correct dimensions (450x380)
   - Clear browser cache in OBS

### Debug Mode

Enable debug logging:

```javascript
// Add to console
localStorage.setItem('gols-debug', 'true');
window.location.reload();
```

### Performance Monitoring

```javascript
// Monitor widget performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
observer.observe({ entryTypes: ['measure', 'navigation'] });
```
