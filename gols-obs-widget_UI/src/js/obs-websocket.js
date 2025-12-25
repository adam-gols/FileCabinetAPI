/**
 * OBS WebSocket Integration Service
 * Manages connection and recording control for OBS Studio
 */
class OBSWebSocketService {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.host = 'localhost';
    this.port = 4455;
    this.password = '';
    this.enabled = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
    
    this.loadSettings();
  }

  /**
   * Load OBS settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('gols-obs-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.host = parsed.host || 'localhost';
        this.port = parsed.port || 4455;
        this.password = parsed.password || '';
        this.enabled = parsed.enabled || false;
      }
    } catch (error) {
      console.warn('Failed to load OBS settings:', error);
    }
  }

  /**
   * Save OBS settings to localStorage
   */
  saveSettings(settings) {
    try {
      this.host = settings.host || 'localhost';
      this.port = settings.port || 4455;
      this.password = settings.password || '';
      this.enabled = settings.enabled || false;
      
      localStorage.setItem('gols-obs-settings', JSON.stringify({
        host: this.host,
        port: this.port,
        password: this.password,
        enabled: this.enabled
      }));
      
      console.log('💾 OBS settings saved');
      return true;
    } catch (error) {
      console.error('Failed to save OBS settings:', error);
      return false;
    }
  }

  /**
   * Connect to OBS WebSocket
   */
  async connect() {
    if (!this.enabled) {
      console.log('📹 OBS integration disabled');
      return false;
    }

    if (this.isConnected) {
      console.log('📹 Already connected to OBS');
      return true;
    }

    return new Promise((resolve) => {
      try {
        const wsUrl = `ws://${this.host}:${this.port}`;
        console.log(`📹 Connecting to OBS WebSocket: ${wsUrl}`);
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('📹 Connected to OBS WebSocket');
          this.authenticate().then(resolve).catch(() => resolve(false));
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.websocket.onclose = () => {
          console.log('📹 OBS WebSocket connection closed');
          this.isConnected = false;
          this.websocket = null;
        };

        this.websocket.onerror = (error) => {
          console.error('📹 OBS WebSocket error:', error);
          this.isConnected = false;
          resolve(false);
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('📹 OBS WebSocket connection timeout');
            if (this.websocket) {
              this.websocket.close();
            }
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('📹 Failed to connect to OBS:', error);
        resolve(false);
      }
    });
  }

  /**
   * Authenticate with OBS WebSocket
   */
  async authenticate() {
    return new Promise((resolve) => {
      // First, get authentication info
      this.sendRequest('GetAuthRequired').then((response) => {
        if (!response.authRequired) {
          console.log('📹 OBS authentication not required');
          this.isConnected = true;
          resolve(true);
        } else {
          console.log('📹 OBS authentication required');
          // For simplicity, we'll assume no auth for now
          // In production, you'd implement proper authentication with password
          this.isConnected = true;
          resolve(true);
        }
      }).catch((error) => {
        console.error('📹 OBS authentication failed:', error);
        resolve(false);
      });
    });
  }

  /**
   * Send request to OBS WebSocket
   */
  sendRequest(requestType, requestData = {}) {
    return new Promise((resolve, reject) => {
      if (!this.websocket || !this.isConnected) {
        reject(new Error('Not connected to OBS'));
        return;
      }

      const messageId = (++this.messageId).toString();
      const message = {
        'request-type': requestType,
        'message-id': messageId,
        ...requestData
      };

      this.pendingRequests.set(messageId, { resolve, reject });
      this.websocket.send(JSON.stringify(message));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    if (message['message-id'] && this.pendingRequests.has(message['message-id'])) {
      const { resolve, reject } = this.pendingRequests.get(message['message-id']);
      this.pendingRequests.delete(message['message-id']);

      if (message.status === 'ok') {
        resolve(message);
      } else {
        reject(new Error(message.error || 'Unknown error'));
      }
    }
  }

  /**
   * Check if OBS is currently recording
   */
  async isRecording() {
    try {
      const response = await this.sendRequest('GetRecordingStatus');
      return response.isRecording || false;
    } catch (error) {
      console.error('📹 Failed to get recording status:', error);
      return false;
    }
  }

  /**
   * Start recording with specified filename
   */
  async startRecording(filename) {
    try {
      if (!filename) {
        throw new Error('Filename is required');
      }

      // Set recording filename
      await this.sendRequest('SetFilenameFormatting', {
        'filename-formatting': filename
      });

      // Start recording
      await this.sendRequest('StartRecording');
      console.log(`📹 Started recording: ${filename}`);
      return true;
    } catch (error) {
      console.error('📹 Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop current recording
   */
  async stopRecording() {
    try {
      await this.sendRequest('StopRecording');
      console.log('📹 Stopped recording');
      return true;
    } catch (error) {
      console.error('📹 Failed to stop recording:', error);
      return false;
    }
  }

  /**
   * Generate filename for game recording
   */
  generateGameFilename(gameData) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    
    const eventName = sanitize(gameData.event || 'Event');
    const gameNumber = sanitize(gameData.gameNumber || 'Game');
    const team1 = sanitize(gameData.team1 || 'Team1');
    const team2 = sanitize(gameData.team2 || 'Team2');
    
    return `${eventName}_${gameNumber}_${team1}_vs_${team2}_${date}`;
  }

  /**
   * Handle game recording transition (stop current, start new)
   */
  async transitionGameRecording(gameData) {
    if (!this.enabled) {
      console.log('📹 OBS integration disabled, skipping recording transition');
      return { success: false, reason: 'disabled' };
    }

    try {
      // Connect if not already connected
      const connected = await this.connect();
      if (!connected) {
        return { success: false, reason: 'connection_failed' };
      }

      // Check if currently recording
      const currentlyRecording = await this.isRecording();
      
      // Generate new filename
      const newFilename = this.generateGameFilename(gameData);
      
      if (currentlyRecording) {
        // Stop current recording
        console.log('📹 Stopping current recording...');
        await this.stopRecording();
        
        // Wait a moment for the recording to fully stop
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Start new recording
      console.log(`📹 Starting new recording: ${newFilename}`);
      const started = await this.startRecording(newFilename);
      
      return { 
        success: started, 
        filename: newFilename,
        wasRecording: currentlyRecording
      };
      
    } catch (error) {
      console.error('📹 Failed to transition recording:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Disconnect from OBS WebSocket
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
    console.log('📹 Disconnected from OBS');
  }
}

// Make available globally
window.OBSWebSocketService = OBSWebSocketService;
