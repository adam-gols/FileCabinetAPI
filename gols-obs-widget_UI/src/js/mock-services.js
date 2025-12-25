/**
 * Mock Event Manager - Simple event system for demo purposes
 */
class MockEventManager {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}

/**
 * Mock Settings Manager - Simple settings storage for demo
 */
class MockSettingsManager {
  constructor() {
    this.settings = new Map();
    this.sessionState = {};
  }

  getSetting(key, defaultValue) {
    return this.settings.get(key) ?? defaultValue;
  }

  setSetting(key, value) {
    this.settings.set(key, value);
  }

  getSessionState() {
    return { ...this.sessionState };
  }

  updateSessionState(updates) {
    this.sessionState = { ...this.sessionState, ...updates };
  }
}

/**
 * Mock Logger - Simple console logging for demo
 */
class MockLogger {
  debug(message, meta, error) {
    console.debug(`[DEBUG] ${message}`, meta, error);
  }

  info(message, meta) {
    console.info(`[INFO] ${message}`, meta);
  }

  warn(message, meta) {
    console.warn(`[WARN] ${message}`, meta);
  }

  error(message, meta, error) {
    console.error(`[ERROR] ${message}`, meta, error);
  }

  critical(message, meta, error) {
    console.error(`[CRITICAL] ${message}`, meta, error);
  }
}

// Create singleton instances
const mockEventManager = new MockEventManager();
const mockSettingsManager = new MockSettingsManager();
const mockLogger = new MockLogger();

// Make available globally
window.mockEventManager = mockEventManager;
window.mockSettingsManager = mockSettingsManager;
window.mockLogger = mockLogger;
