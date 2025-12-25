# GOLS UI Widget - Complete Documentation

A professional, standalone UI widget for Game On Live Studio (GOLS) game information display. This widget provides a pixel-perfect 450x380px interface optimized for OBS Browser Sources and seamless integration into any project.

## 🎯 Features

- **🎨 Pixel-Perfect Design**: Exact 450x380px dimensions with professional GOLS branding
- **⚙️ Centered Settings Panel**: Fully functional configuration popup with dark theme
- **🎮 Game Management**: Event selection, game navigation, score tracking, and real-time updates
- **🔄 Demo Mode**: Built-in mock data with auto-refresh functionality for testing
- **📱 Responsive Controls**: Optimized dropdowns, inputs, and buttons for compact layout
- **🎭 Zero Dependencies**: Pure HTML, CSS, and JavaScript - no frameworks required
- **📦 Fully Portable**: Copy-paste ready for any project or OBS integration

## 📁 Project Structure

```
gols-ui-widget/
├── index.html              # Main widget page (ready to run)
├── README.md               # Complete documentation (this file)
├── assets/                 # Static assets
│   └── gols-logo.svg      # Official GOLS logo
├── src/                   # Source files
│   ├── styles/            # CSS stylesheets (4 files)
│   │   ├── main.css       # Base styles, variables, and typography
│   │   ├── components.css # UI component styles and interactions
│   │   ├── game-info.css  # Game display layout and styling
│   │   └── compact.css    # Compact layout optimizations (CRITICAL)
│   └── js/                # JavaScript files (4 files)
│       ├── main.js        # Application entry point and initialization
│       ├── ui-manager.js  # Main UI controller with all functionality
│       ├── mock-services.js # Mock API services for standalone demo
│       └── demo-data.js   # Sample game and event data
└── docs/                  # Technical documentation
    ├── ARCHITECTURE.md    # System architecture and data flow
    ├── COMPONENTS.md      # UI components and interactions guide
    ├── STYLING.md         # CSS architecture and theming
    ├── API.md             # JavaScript API reference
    └── INTEGRATION.md     # Integration and deployment guide
```

## 🚀 Quick Start

### Method 1: Direct Usage (Fastest)
```bash
# Copy the folder to your project
cp -r gols-ui-widget/ /path/to/your/project/

# Open in browser
open gols-ui-widget/index.html
```

### Method 2: OBS Browser Source
1. Add Browser Source in OBS Studio
2. Set URL: `file:///absolute/path/to/gols-ui-widget/index.html`
3. Set Width: `450`, Height: `380`
4. Widget loads instantly with demo data

### Method 3: Web Embed
```html
<iframe 
  src="gols-ui-widget/index.html" 
  width="450" 
  height="380"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>
```

## 🎮 Interactive Demo Features

The widget includes fully functional demo mode:

### Demo Controls
- **Event Dropdown**: Switch between Basketball, Football, and Soccer events
- **Stream Dropdown**: Select different streaming configurations
- **Game Navigation**: `< REVIEW PREV. GAME` and `SAVE & NEXT GAME >` buttons
- **Settings Panel**: Click ⚙️ gear icon for configuration popup

### Settings Panel Features
- **Centered Modal**: Perfect positioning within 450x380px widget bounds
- **Dark Theme**: Professional #2a2a2a background with white text
- **Functional Close**: Click X or click outside panel to close
- **Demo Configuration**: Toggle Debug Mode and Auto-refresh Demo Data
- **Smooth Animations**: CSS transitions for professional feel

### Live Demo Data
- **Auto-refresh**: Demo data updates every few seconds
- **Interactive Inputs**: All form fields are functional
- **Real-time Updates**: Score changes, team names, comments
- **Game Navigation**: Browse through multiple games with navigation buttons

## 🎨 Technical Architecture

### CSS Architecture (Layered Approach)
```
main.css         → Base styles, variables, typography
components.css   → UI components, buttons, forms
game-info.css    → Game-specific layouts and displays
compact.css      → Critical 450x380px optimizations and overrides
```

**Key CSS Features:**
- **CSS Custom Properties**: `--gols-cardinal-red`, `--gols-william-green`, etc.
- **Flexbox Centering**: Settings panel uses `display: flex; align-items: center; justify-content: center`
- **Specificity Management**: `#gols-widget .class-name` for scoped styling
- **Responsive Constraints**: `max-width` and `max-height` properties ensure widget bounds

### JavaScript Architecture (Modular Design)
```
main.js           → Entry point, error handling, initialization
ui-manager.js     → Core logic, event handling, UI updates
mock-services.js  → Simulated API services for demo mode
demo-data.js      → Sample data structures and mock responses
```

**Key JavaScript Features:**
- **Event-Driven**: Clean event listeners for all interactions
- **Error Handling**: Comprehensive error states and recovery
- **Debugging Support**: Console logging and global access (`window.golsUI`)
- **Memory Management**: Proper cleanup and event unbinding

## ⚙️ Settings Panel Implementation

The settings panel is a key feature with specific technical requirements:

### CSS Implementation
```css
/* Overlay: Full widget coverage with flexbox centering */
#gols-widget .gols-settings-overlay {
  position: absolute !important;
  top: 0 !important; left: 0 !important;
  width: 100% !important; height: 100% !important;
  display: none !important; /* Hidden by default */
  background: rgba(0,0,0,0.7) !important;
}

/* Panel: Centered modal with dark theme */
.gols-settings-panel {
  background: #2a2a2a; color: #fff;
  border: 2px solid #444; border-radius: 8px;
  padding: 0; /* No outer padding - header extends to edges */
  position: relative; /* Positioned by flexbox parent */
}

/* Content: Inner padding for form elements */
.gols-settings-content { padding: 15px; }
```

### JavaScript Control
```javascript
// Show/hide with proper display control
toggleSettings(show) {
  const overlay = document.getElementById('settings-overlay');
  overlay.style.display = show ? 'flex' : 'none';
  // flex enables centering, none hides completely
}
```

## 🔧 Integration Guide

### Replace Mock Data
```javascript
// In mock-services.js, replace mock functions:
class EventService {
  async getEvents() {
    // Replace: return mockEvents;
    const response = await fetch('/api/events');
    return response.json();
  }
}
```

### Custom Styling
```css
/* Override GOLS colors */
:root {
  --gols-cardinal-red: #your-color;
  --gols-william-green: #your-color;
}
```

### Event Handling
```javascript
// Access widget instance
const widget = window.golsUI;
widget.navigateGame(1); // Next game
widget.toggleSettings(true); // Open settings
```

## 🐛 Troubleshooting

### Settings Panel Issues
- **Panel not showing**: Check console for element IDs, ensure scripts loaded
- **Not centered**: Verify CSS overlay has `display: flex` when visible
- **Can't close**: Check event listeners on close button and overlay clicks

### Layout Issues
- **Widget too large**: Container must be exactly 450x380px
- **Elements cut off**: Check `compact.css` for dimension constraints
- **Dropdowns clipped**: Ensure parent has `overflow: visible`

### Demo Data Issues
- **No data loading**: Check `demo-data.js` and `mock-services.js` files present
- **Auto-refresh not working**: Check Settings panel → Auto-refresh Demo Data checkbox

## 🏆 Success Metrics

This widget achieves:
- ✅ **Pixel-Perfect**: Exact 450x380px dimensions
- ✅ **Professional UI**: Centered settings panel, smooth interactions
- ✅ **Zero Dependencies**: No external frameworks required
- ✅ **Instant Setup**: Copy-paste ready for immediate use
- ✅ **OBS Compatible**: Optimized for browser source integration
- ✅ **Developer Friendly**: Clean code, comprehensive documentation

## 📄 License & Credits

- **Created for**: Game On Live Studio (GOLS)
- **Optimized for**: OBS Studio Browser Sources
- **Dependencies**: Font Awesome icons, Google Fonts (Roboto, Oswald)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

---

**Ready to use immediately - just copy the folder and open `index.html`!** 🚀
    return response.json();
  }
}
```

## 📱 Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## 🔧 Development

### File Organization

- **HTML**: Single `index.html` file with inline styles for container
- **CSS**: Modular stylesheets for maintainability
- **JavaScript**: ES6+ with class-based architecture
- **Assets**: Minimal external dependencies

### Code Style

- **CSS**: BEM-inspired naming with `gols-` prefix
- **JavaScript**: ES6 classes with camelCase methods
- **HTML**: Semantic structure with ARIA labels

## 📖 Documentation

See the `docs/` folder for detailed documentation:

- **[Architecture](docs/ARCHITECTURE.md)**: System design and structure
- **[Components](docs/COMPONENTS.md)**: UI component details
- **[Styling](docs/STYLING.md)**: CSS organization and theming
- **[API Reference](docs/API.md)**: JavaScript API documentation
- **[Integration](docs/INTEGRATION.md)**: Embedding and customization guide

## 🤝 Support

This widget is designed to be:
- **Self-contained**: No external dependencies
- **Copy-friendly**: Easy to move between projects
- **Well-documented**: Clear code and comprehensive docs
- **Demo-enabled**: Works out of the box with sample data

## 🏷️ Version

Current Version: 1.0.0
Widget Dimensions: 450px × 380px
Last Updated: December 2025
