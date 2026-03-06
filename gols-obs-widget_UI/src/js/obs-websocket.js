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
          console.log('📹 WebSocket connection opened');
          // Don't set connected immediately - wait for Hello message
        };

        this.websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          // Handle Hello message (opcode 0)
          if (message.op === 0) {
            console.log('📹 Received Hello from OBS, sending Identify...');
            this.sendIdentify().then(() => {
              this.isConnected = true;
              console.log('📹 Successfully connected and identified with OBS');
              resolve(true);
            }).catch((error) => {
              console.error('📹 Failed to identify with OBS:', error);
              resolve(false);
            });
          } else {
            this.handleMessage(message);
          }
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
   * Authenticate with OBS WebSocket (simplified for v5.x)
   */
  async authenticate() {
    // In OBS WebSocket v5.x, authentication is handled during the Identify handshake
    // This method is kept for compatibility but doesn't need to do much
    console.log('📹 Authentication handled during Identify handshake');
    return true;
  }

  /**
   * Send request to OBS WebSocket
   */
  sendRequest(requestType, requestData = {}) {
    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = (++this.messageId).toString();
      
      // OBS WebSocket v5.x format
      const message = {
        op: 6, // Request opcode
        d: {
          requestType: requestType,
          requestId: messageId,
          requestData: requestData
        }
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
   * Send Identify message to OBS WebSocket v5.x
   */
  async sendIdentify() {
    return new Promise((resolve, reject) => {
      const identifyMessage = {
        op: 1, // Identify opcode
        d: {
          rpcVersion: 1,
          eventSubscriptions: 33, // General + Config + Scenes + Inputs + Outputs
        }
      };
      
      // Add authentication if password is provided
      if (this.password) {
        // For now, we'll skip authentication implementation
        // In production, implement proper challenge-response auth
        console.log('📹 Password authentication not yet implemented');
      }
      
      this.websocket.send(JSON.stringify(identifyMessage));
      
      // Wait for Identified response (opcode 2)
      const originalHandler = this.handleMessage.bind(this);
      this.handleMessage = (message) => {
        if (message.op === 2) {
          console.log('📹 Received Identified response');
          this.handleMessage = originalHandler;
          resolve(true);
        } else {
          originalHandler(message);
        }
      };
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.handleMessage = originalHandler;
        reject(new Error('Identify timeout'));
      }, 5000);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    console.log('📹 Received OBS message:', message);
    
    // Handle different message types based on opcode
    switch (message.op) {
      case 0: // Hello message
        console.log('📹 Received Hello from OBS');
        break;
        
      case 2: // Identify response
        console.log('📹 Identified with OBS');
        break;
        
      case 7: // RequestResponse
        if (message.d && message.d.requestId && this.pendingRequests.has(message.d.requestId)) {
          const { resolve, reject } = this.pendingRequests.get(message.d.requestId);
          this.pendingRequests.delete(message.d.requestId);

          if (message.d.requestStatus && message.d.requestStatus.result) {
            resolve(message.d.responseData || {});
          } else {
            const error = message.d.requestStatus?.comment || 'Unknown error';
            reject(new Error(error));
          }
        }
        break;
        
      case 5: // Event
        console.log('📹 OBS Event:', message.d);
        break;
        
      default:
        console.log('📹 Unknown OBS message type:', message.op);
    }
  }

  /**
   * Check if OBS is currently recording
   */
  async isRecording() {
    try {
      const response = await this.sendRequest('GetRecordStatus');
      return response.outputActive || false;
    } catch (error) {
      console.error('📹 Failed to get recording status:', error);
      return false;
    }
  }

  /**
   * Start recording (filename should already be set)
   */
  async startRecording() {
    try {
      await this.sendRequest('StartRecord');
      console.log('📹 Started recording');
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
      await this.sendRequest('StopRecord');
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
    console.log('📹 Generating filename for game data:', gameData);

    const sanitize = (value) => {
      const str = String(value || '').trim();
      if (!str) return 'Unknown';
      // Keep letters/numbers, replace everything else with underscores
      return str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    };

    const formatMMDDYY = (input) => {
      // Accept Date, ISO date, or MM/DD/YYYY
      try {
        if (!input) return null;
        if (input instanceof Date) {
          const mm = String(input.getMonth() + 1).padStart(2, '0');
          const dd = String(input.getDate()).padStart(2, '0');
          const yy = String(input.getFullYear()).slice(-2);
          return `${mm}-${dd}-${yy}`;
        }
        const s = String(input).trim();
        // MM/DD/YYYY
        let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (m) {
          const mm = String(m[1]).padStart(2, '0');
          const dd = String(m[2]).padStart(2, '0');
          const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
          const yy = String(yyyy).slice(-2);
          return `${mm}-${dd}-${yy}`;
        }
        // YYYY-MM-DD (or ISO)
        m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          const yy = m[1].slice(-2);
          return `${m[2]}-${m[3]}-${yy}`;
        }
        // Fallback: try Date parsing
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const yy = String(d.getFullYear()).slice(-2);
          return `${mm}-${dd}-${yy}`;
        }
        return null;
      } catch {
        return null;
      }
    };

    const formatTimeCompact = (input) => {
      // Desired example: 8:00AM (no space)
      if (!input) return null;
      const s = String(input).trim();
      // Already like 8:00 AM / 8:00AM
      let m = s.match(/^(\d{1,2}:\d{2})\s*([AaPp][Mm])$/);
      if (m) return `${m[1]}${m[2].toUpperCase()}`;
      // 800AM / 0800AM
      m = s.match(/^(\d{1,2})(\d{2})\s*([AaPp][Mm])$/);
      if (m) return `${parseInt(m[1], 10)}:${m[2]}${m[3].toUpperCase()}`;
      // 24h time 13:05
      m = s.match(/^(\d{1,2}):(\d{2})$/);
      if (m) {
        let hh = parseInt(m[1], 10);
        const mm = m[2];
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        if (hh === 0) hh = 12;
        return `${hh}:${mm}${ampm}`;
      }
      return sanitize(s);
    };

    const eventName = sanitize(gameData.event || 'Event');
    const dateStr = formatMMDDYY(gameData.date) || formatMMDDYY(new Date()) || 'UnknownDate';
    const location = sanitize(gameData.location || 'Location');
    const timeStr = formatTimeCompact(gameData.time || gameData.officialStartTime || gameData.officialStart || gameData.startTime) || 'UnknownTime';
    const team1 = sanitize(gameData.team1 || 'Team1');
    const team2 = sanitize(gameData.team2 || 'Team2');

    // Include OBS-safe timestamp token to avoid relying on OBS' own suffixing behavior.
    // OBS supports strftime-style tokens in FilenameFormatting (example: %Y%m%d-%H%M%S).
    const obsTimestamp = '%Y%m%d-%H%M%S';

    // Do NOT include an extension in FilenameFormatting; OBS will append the correct container.
    const filename = `${eventName}_${dateStr}_${location}_${timeStr}_${team1}_vs_${team2}`;

    console.log('📹 Generated filename:', filename);
    return filename;
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
      console.log(`📹 Currently recording: ${currentlyRecording}`);
      
      // STEP 1: STOP current recording (if recording)
      if (currentlyRecording) {
        console.log('📹 STEP 1: Stopping current recording...');
        await this.stopRecording();
        
        // Wait for recording to fully stop and file to be saved
        console.log('📹 STEP 1: Waiting 2 seconds for recording to fully stop...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('📹 STEP 1: Recording stopped successfully');
      } else {
        console.log('📹 STEP 1: No recording to stop (first game)');
      }
      
      // STEP 2: Generate and SET the new filename for the upcoming game
      const newFilename = this.generateGameFilename(gameData);
      console.log(`📹 STEP 2: Setting new filename format: ${newFilename}`);
      await this.sendRequest('SetProfileParameter', {
        parameterCategory: 'Output',
        parameterName: 'FilenameFormatting',
        parameterValue: newFilename
      });
      
      // Wait for filename to be processed by OBS
      console.log('📹 STEP 2: Waiting 2 seconds for filename to be set in OBS...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Optionally verify
      try {
        const currentFormat = await this.sendRequest('GetProfileParameter', {
          parameterCategory: 'Output',
          parameterName: 'FilenameFormatting'
        });
        if (currentFormat.parameterValue !== newFilename) {
          console.warn(`📹 WARNING: Filename not set correctly! Expected: ${newFilename}, Got: ${currentFormat.parameterValue}`);
        }
      } catch (error) {
        console.warn('📹 Could not verify filename format:', error);
      }
      
      // STEP 3: START new recording with the new filename
      console.log(`📹 STEP 3: Starting new recording with filename: ${newFilename}`);
      await this.sendRequest('StartRecord');
      
      // Wait for recording to start
      console.log('📹 STEP 3: Waiting 1 second for recording to start...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('📹 Recording started successfully');
      
      return { 
        success: true, 
        filename: newFilename,
        wasRecording: currentlyRecording
      };
      
    } catch (error) {
      console.error('📹 Failed to transition recording:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Set the filename for the next recording in OBS (without starting recording)
   */
  async setRecordingFilename(gameData) {
    if (!this.enabled) {
      console.log('📹 OBS integration disabled, skipping filename set');
      return { success: false, reason: 'disabled' };
    }
    try {
      // Connect if not already connected
      const connected = await this.connect();
      if (!connected) {
        return { success: false, reason: 'connection_failed' };
      }
      const newFilename = this.generateGameFilename(gameData);
      console.log(`📹 Setting filename format (no recording): ${newFilename}`);
      await this.sendRequest('SetProfileParameter', {
        parameterCategory: 'Output',
        parameterName: 'FilenameFormatting',
        parameterValue: newFilename
      });
      // Wait for filename to be processed by OBS
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Optionally verify
      try {
        const currentFormat = await this.sendRequest('GetProfileParameter', {
          parameterCategory: 'Output',
          parameterName: 'FilenameFormatting'
        });
        if (currentFormat.parameterValue !== newFilename) {
          console.warn(`📹 WARNING: Filename not set correctly! Expected: ${newFilename}, Got: ${currentFormat.parameterValue}`);
        }
      } catch (error) {
        console.warn('📹 Could not verify filename format:', error);
      }
      return { success: true, filename: newFilename };
    } catch (error) {
      console.error('📹 Failed to set filename:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Get current filename formatting
   */
  async getCurrentFilenameFormatting() {
    try {
      const response = await this.sendRequest('GetProfileParameter', {
        parameterCategory: 'Output',
        parameterName: 'FilenameFormatting'
      });
      console.log('📹 Current filename formatting:', response.parameterValue);
      return response.parameterValue;
    } catch (error) {
      console.error('📹 Failed to get filename formatting:', error);
      return null;
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
