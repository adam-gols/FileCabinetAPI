/**
 * GOLS UI Manager - Main UI Controller
 * Handles the compact widget interface for game information display
 */
class UIManager {
  constructor() {
    this.isInitialized = false;
    this.currentEvent = null;
    this.currentGameIndex = 0;
    this.currentSchedule = null; // Store loaded schedule
    this.currentStreams = []; // Store current streams
    this.originalGameData = null; // Store original data for comparison
    this.timezoneOffset = 0; // Hours to add/subtract from local time
    this.fileCabinetAPI = new FileCabinetAPIService();
    this.events = []; // Store fetched events
    
    console.log('UIManager created - will load original UI structure with File Cabinet integration');
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('UI Manager already initialized');
      return;
    }

    console.log('🎨 Starting UI Manager initialization with original UI structure...');

    try {
      // Load the original UI template structure
      await this.loadOriginalTemplate();
      
      // Load any saved timezone offset first
      this.loadTimezoneOffset();
      
      // Show timezone confirmation popup before allowing interaction
      console.log('🕐 Showing timezone verification popup...');
      const timezoneConfirmed = await this.showTimezonePopup();
      
      if (!timezoneConfirmed) {
        console.log('⚠️ User cancelled timezone setup');
        return; // Don't proceed if user cancels timezone setup
      }
      
      // Initialize components with File Cabinet API
      await this.initializeComponents();
      
      // Bind event listeners
      this.bindEvents();
      
      this.isInitialized = true;
      console.log('✅ UI Manager initialization complete');
      
    } catch (error) {
      console.error('❌ UI Manager initialization failed:', error);
      throw error;
    }
  }

  async loadOriginalTemplate() {
    const widgetContainer = document.getElementById('gols-widget');
    
    if (!widgetContainer) {
      throw new Error('Widget container not found');
    }

    // Use the correct original template content (the compact game info UI)
    const templateContent = this.createOriginalTemplateContent();
    widgetContainer.innerHTML = templateContent;
    
    console.log('✅ Original compact game info template loaded successfully');
    
    // Set demo mode status
    this.setDemoModeStatus();
  }

  createOriginalTemplateContent() {
    return `
      <!-- Header -->
      <header class="gols-header">
        <div class="gols-logo-section">
          <img src="assets/gols-logo.svg" alt="Game On Live Studio" class="gols-logo-img">
        </div>
        <div class="gols-title">GAME INFO</div>
        <button id="toggle-settings" class="gols-settings-btn">
          <i class="fas fa-cog"></i>
        </button>
      </header>

      <!-- Top Controls -->
      <section class="gols-top-controls">
        <div class="gols-control-group">
          <div class="gols-control-header">
            <label class="gols-control-label">EVENT</label>
            <button id="refresh-events" class="gols-refresh-btn" title="Refresh Events">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <select id="event-selector" class="gols-dropdown">
            <option value="">Select an event...</option>
          </select>
        </div>
        <div class="gols-control-group">
          <div class="gols-control-header">
            <label class="gols-control-label">STREAM</label>
            <button id="refresh-schedule" class="gols-refresh-btn" title="Refresh Schedule">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <select id="stream-selector" class="gols-dropdown">
            <option value="">Select stream...</option>
          </select>
        </div>
      </section>

      <!-- Game Info Grid -->
      <section class="gols-game-info">
        <div class="gols-info-item">
          <span class="gols-info-label">DATE:</span>
          <input type="text" class="gols-info-value" id="game-date" value="MM/DD/YYYY" readonly>
        </div>
        <div class="gols-info-item">
          <span class="gols-info-label">LOCATION:</span>
          <input type="text" class="gols-info-value" id="game-location" value="XXXXXXXXXXXXXXX" readonly>
        </div>
        <div class="gols-info-item">
          <span class="gols-info-label">GAME #:</span>
          <input type="text" class="gols-info-value" id="game-number" value="XXXXXXXXXXXXXXX" readonly>
        </div>
        <div class="gols-info-item">
          <span class="gols-info-label">OFFICIAL START:</span>
          <input type="text" class="gols-info-value" id="official-start-time" value="XX:XX AM" readonly>
        </div>
        <div class="gols-info-item">
          <span class="gols-info-label">DIVISION:</span>
          <input type="text" class="gols-info-value" id="game-division" value="XXXXXXXXXXXXXXX" readonly>
        </div>
        <div class="gols-info-item">
          <span class="gols-info-label">ACTUAL START:</span>
          <input type="text" class="gols-info-value highlight" id="actual-start-time" value="XX:XX AM">
        </div>
      </section>

      <!-- Teams and Scores -->
      <section class="gols-teams-section">
        <div class="gols-teams-header">
          <div class="gols-team-label">TEAM 1</div>
          <div class="gols-score-label">SCORE</div>
          <div class="gols-team-label">TEAM 2</div>
          <div class="gols-score-label">SCORE</div>
        </div>
        <div class="gols-teams-inputs">
          <input type="text" class="gols-team-input" id="team1-name" value="XXXXXXXXXXXXXXX">
          <input type="text" class="gols-score-input" id="team1-score" value="XX.XX">
          <input type="text" class="gols-team-input" id="team2-name" value="XXXXXXXXXXXXXXX">
          <input type="text" class="gols-score-input" id="team2-score" value="XX.XX">
        </div>
      </section>

      <!-- Comments -->
      <section class="gols-comments-section">
        <label class="gols-comments-label">COMMENTS:</label>
        <input type="text" class="gols-comments-input" id="game-comments" value="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX">
      </section>

      <!-- Navigation -->
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

      <!-- Settings Panel (hidden by default) -->
      <div class="gols-settings-overlay" id="settings-overlay" style="display: none;">
        <div class="gols-settings-panel">
          <div class="gols-settings-header">
            <h3>Settings</h3>
            <button id="close-settings" class="gols-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="gols-settings-content">
            <div class="gols-settings-group">
              <h4>Demo Configuration</h4>
              <label>
                <input type="checkbox" id="debug-mode"> Debug Mode
              </label>
              <label>
                <input type="checkbox" id="auto-refresh" checked> Auto-refresh Demo Data
              </label>
            </div>

            <div class="gols-settings-actions">
              <button id="reset-settings" class="gols-settings-btn secondary">Reset</button>
              <button id="save-settings" class="gols-settings-btn">Save</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="gols-notifications" id="notifications-area"></div>
    `;
  }

  setDemoModeStatus() {
    // Update title to show File Cabinet integration
    const titleElement = document.querySelector('.gols-title');
    if (titleElement) {
      titleElement.textContent = 'GAME INFO (FILE CABINET)';
    }
  }

  async loadEventsFromAPI() {
    try {
      console.log('🌐 Loading events from File Cabinet API...');
      
      // Fetch events from File Cabinet API
      const fileCabinetEvents = await this.fileCabinetAPI.getEvents();
      
      // Convert to UI format
      this.events = this.fileCabinetAPI.convertEventsToUIFormat(fileCabinetEvents);
      
      console.log(`✅ Loaded ${this.events.length} events from File Cabinet`);
      console.log('Events data:', this.events);
      
      // Update title to show successful File Cabinet connection
      const titleElement = document.querySelector('.gols-title');
      if (titleElement) {
        titleElement.textContent = 'GAME INFO (FILE CABINET)';
      }
      
    } catch (error) {
      console.error('❌ Failed to load events from File Cabinet API:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Fallback to mock data if API fails
      console.log('📋 Falling back to mock data');
      this.events = window.mockEvents || [];
      
      // Update title to show fallback mode
      const titleElement = document.querySelector('.gols-title');
      if (titleElement) {
        titleElement.textContent = 'GAME INFO (OFFLINE)';
      }
      
      // Show error notification
      setTimeout(() => {
        this.showNotification('error', `API Error: ${error.message || 'Unable to load events'}`);
      }, 1000);
    }
  }

  async initializeComponents() {
    // Load events from File Cabinet API
    await this.loadEventsFromAPI();
    
    // Populate event selector with File Cabinet data
    this.populateEventSelector();
    
    // Initialize empty stream selector (will be populated when event is selected)
    this.clearStreamSelector();
    
    // Show initial notifications
    this.showDemoNotifications();
  }

  bindEvents() {
    // Event selector
    const eventSelector = document.getElementById('event-selector');
    if (eventSelector) {
      eventSelector.addEventListener('change', this.handleEventChange.bind(this));
    }

    // Refresh events button
    const refreshEvents = document.getElementById('refresh-events');
    if (refreshEvents) {
      refreshEvents.addEventListener('click', this.handleRefreshEvents.bind(this));
    }

    // Refresh schedule button
    const refreshSchedule = document.getElementById('refresh-schedule');
    if (refreshSchedule) {
      refreshSchedule.addEventListener('click', this.handleRefreshSchedule.bind(this));
    }

    // Stream selector
    const streamSelector = document.getElementById('stream-selector');
    if (streamSelector) {
      streamSelector.addEventListener('change', this.handleStreamChange.bind(this));
    }

    // Game navigation
    const prevGame = document.getElementById('prev-game');
    const nextGame = document.getElementById('next-game');
    
    if (prevGame) prevGame.addEventListener('click', () => this.navigateGame(-1));
    if (nextGame) nextGame.addEventListener('click', () => this.navigateGame(1));

    // Settings panel
    const toggleSettings = document.getElementById('toggle-settings');
    const closeSettings = document.getElementById('close-settings');
    const settingsOverlay = document.getElementById('settings-overlay');
    
    if (toggleSettings) {
      toggleSettings.addEventListener('click', () => this.toggleSettings(true));
    }
    
    if (closeSettings) {
      closeSettings.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSettings(false);
      });
    }
    
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
          this.toggleSettings(false);
        }
      });
    }

    // Team and score inputs
    const inputs = ['team1-name', 'team2-name', 'team1-score', 'team2-score', 'game-comments', 'actual-start-time'];
    inputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', this.handleGameDataChange.bind(this));
      }
    });
  }

  populateEventSelector() {
    const eventSelector = document.getElementById('event-selector');
    if (!eventSelector) return;

    // Clear existing options except first
    eventSelector.innerHTML = '<option value="">Select an event...</option>';
    
    // Add File Cabinet events formatted as "Start Date - End Date: Event Name"
    this.events.forEach(event => {
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = this.fileCabinetAPI.formatEventForDropdown(event);
      eventSelector.appendChild(option);
    });

    // Show status if no events
    if (this.events.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No future events available';
      option.disabled = true;
      eventSelector.appendChild(option);
    }
  }

  populateStreamSelector(streams) {
    const streamSelector = document.getElementById('stream-selector');
    if (!streamSelector) return;

    // Store streams for later use
    this.currentStreams = streams || [];

    // Clear existing options except first
    streamSelector.innerHTML = '<option value="">Select stream...</option>';
    streamSelector.disabled = false;
    
    // Add streams (either from ops sheet or fallback to mock)
    const streamsToUse = this.currentStreams || window.mockStreams || [];
    
    if (streamsToUse.length === 0) {
      streamSelector.innerHTML = '<option value="">No streams available</option>';
      streamSelector.disabled = true;
      return;
    }
    
    streamsToUse.forEach(stream => {
      const option = document.createElement('option');
      option.value = stream.id;
      
      // Handle both new format (from ops sheet) and old format (mock data)
      if (stream.label) {
        // New format from ops sheet: "DATE - Facility - Computer"
        option.textContent = stream.label;
      } else {
        // Old format from mock data
        option.textContent = stream.name;
        if (stream.status === 'inactive') {
          option.textContent += ' (Inactive)';
          option.disabled = true;
        }
      }
      
      streamSelector.appendChild(option);
    });
  }

  /**
   * Load streams for the selected event from its ops sheet
   */
  async loadStreamsForEvent(event) {
    try {
      console.log(`🌐 Loading streams for event: ${event.name}`);
      console.log(`📋 Using ops sheet URL: ${event.eventLink}`);
      
      // Show loading state in stream selector
      const streamSelector = document.getElementById('stream-selector');
      if (streamSelector) {
        streamSelector.innerHTML = '<option value="">Loading streams...</option>';
        streamSelector.disabled = true;
      }

      // Fetch site info from the event's ops sheet
      const siteInfo = await this.fileCabinetAPI.getSiteInfoFromOpsSheet(event.eventLink);
      
      // Convert to stream format
      const streams = this.fileCabinetAPI.convertSiteInfoToStreamFormat(siteInfo);
      
      console.log(`✅ Loaded ${streams.length} streams for event`);
      console.log('Stream data:', streams);
      
      // Populate stream selector
      this.populateStreamSelector(streams);
      
    } catch (error) {
      console.error('❌ Failed to load streams for event:', error);
      
      // Show error in stream selector
      const streamSelector = document.getElementById('stream-selector');
      if (streamSelector) {
        streamSelector.innerHTML = '<option value="">Error loading streams</option>';
        streamSelector.disabled = true;
      }
      
      this.showNotification('error', `Failed to load streams: ${error.message}`);
    }
  }

  /**
   * Clear the stream selector
   */
  clearStreamSelector() {
    const streamSelector = document.getElementById('stream-selector');
    if (streamSelector) {
      streamSelector.innerHTML = '<option value="">Select stream...</option>';
      streamSelector.disabled = false;
    }
  }

  async handleEventChange(event) {
    const target = event.target;
    const eventId = target.value;
    
    const selectedEvent = this.events.find(e => e.id === eventId);
    this.currentEvent = selectedEvent || null;
    this.currentGameIndex = 0;
    
    if (selectedEvent) {
      // Load streams from the selected event's ops sheet
      await this.loadStreamsForEvent(selectedEvent);
      
      this.updateGameDisplay();
      this.updateGameNavigation();
      this.showNotification('success', `Selected event: ${selectedEvent.name}`);
    } else {
      this.clearStreamSelector();
      this.clearGameDisplay();
      this.updateGameNavigation();
    }
  }

  async handleRefreshEvents() {
    try {
      this.showNotification('info', 'Refreshing events from File Cabinet...');
      
      // Clear cache and reload events
      this.fileCabinetAPI.clearCache();
      await this.loadEventsFromAPI();
      this.populateEventSelector();
      
      // Clear current selection
      this.currentEvent = null;
      this.clearGameDisplay();
      this.updateGameNavigation();
      
      this.showNotification('success', `Events refreshed! ${this.events.length} events loaded`);
      
    } catch (error) {
      console.error('Failed to refresh events:', error);
      this.showNotification('error', 'Failed to refresh events from File Cabinet');
    }
  }

  async handleStreamChange(event) {
    const target = event.target;
    const streamId = target.value;
    
    // Find the selected stream from our stored streams
    const stream = this.currentStreams.find(s => s.id === streamId);
    
    if (stream && this.currentEvent) {
      // Load schedule for the selected stream
      await this.loadScheduleForStream(stream);
      
      this.showNotification('info', `Selected stream: ${stream.label || stream.name}`);
    } else {
      // Clear schedule if no stream selected
      this.currentSchedule = null;
      this.currentGameIndex = 0;
      this.updateGameDisplay();
      this.updateGameNavigation();
    }
  }

  async navigateGame(direction) {
    // Check if we have schedule games to navigate through
    if (!this.currentSchedule || !this.currentSchedule.games || this.currentSchedule.games.length === 0) {
      return;
    }
    
    // Save any changes to current game before navigating
    try {
      await this.saveCurrentGameChanges();
    } catch (error) {
      console.error('Error saving current game changes:', error);
      // Continue with navigation even if save fails
    }
    
    const newIndex = this.currentGameIndex + direction;
    if (newIndex >= 0 && newIndex < this.currentSchedule.games.length) {
      this.currentGameIndex = newIndex;
      this.updateGameDisplay();
      
      // If moving to next game (direction > 0), set actual start time to current time
      if (direction > 0) {
        const currentTime = this.getCurrentLocalTime();
        this.setInputValue('actual-start-time', currentTime);
        
        // Update the stored original data so it's considered a "change" that will be saved
        if (this.originalGameData) {
          // Don't update originalGameData here - let it remain as the original value
          // This way the change will be detected and saved on next navigation
        }
        
        console.log(`🕐 Set actual start time for game ${newIndex + 1}: ${currentTime}`);
        this.showNotification('info', `Game ${newIndex + 1} actual start time set to ${currentTime}`);
      }
      
      this.updateGameNavigation();
      
      const actionText = direction > 0 ? 'Next game' : 'Previous game';
      const gameNum = newIndex + 1;
      const totalGames = this.currentSchedule.games.length;
      this.showNotification('info', `${actionText} loaded (${gameNum} of ${totalGames})`);
    }
  }

  updateGameDisplay() {
    // Check if we have schedule data
    if (this.currentSchedule && this.currentSchedule.games && this.currentSchedule.games.length > 0) {
      // Display data from the loaded schedule
      const game = this.currentSchedule.games[this.currentGameIndex] || {};
      
      // Store original game data for comparison
      this.originalGameData = {
        'game-date': game.date || this.currentSchedule.date || '',
        'game-location': game.location || this.currentSchedule.location || '',
        'game-number': game.gameNumber || game.game || `Game ${this.currentGameIndex + 1}`,
        'official-start-time': game.time || game.officialStart || game.startTime || 'TBD',
        'game-division': game.division || game.league || 'TBD',
        'actual-start-time': game.actualStartTime || game.actualStart || 'TBD',
        'team1-name': game.team1 || game.homeTeam || game.team1Name || 'TBD',
        'team2-name': game.team2 || game.awayTeam || game.team2Name || 'TBD',
        'team1-score': game.t1Score || game.team1Score || game.homeScore || '0.00',
        'team2-score': game.t2Score || game.team2Score || game.awayScore || '0.00',
        'game-comments': game.comments || game.notes || ''
      };
      
      // Update game details from schedule data (mapping API response fields)
      this.setInputValue('game-date', this.originalGameData['game-date']);
      this.setInputValue('game-location', this.originalGameData['game-location']);
      this.setInputValue('game-number', this.originalGameData['game-number']);
      this.setInputValue('official-start-time', this.originalGameData['official-start-time']);
      this.setInputValue('game-division', this.originalGameData['game-division']);
      this.setInputValue('actual-start-time', this.originalGameData['actual-start-time']);
      this.setInputValue('team1-name', this.originalGameData['team1-name']);
      this.setInputValue('team2-name', this.originalGameData['team2-name']);
      this.setInputValue('team1-score', this.originalGameData['team1-score']);
      this.setInputValue('team2-score', this.originalGameData['team2-score']);
      this.setInputValue('game-comments', this.originalGameData['game-comments']);
      
      // Special handling for first game: set actual start time to 5 minutes before official start
      if (this.currentGameIndex === 0 && (!game.actualStartTime || game.actualStartTime === 'TBD' || game.actualStartTime === '')) {
        this.setFirstGameActualStartTime();
      }
      
    } else if (!this.currentEvent) {
      // No event selected - clear display
      this.originalGameData = null;
      this.clearGameDisplay();
      
    } else {
      // Event selected but no schedule loaded yet
      // Display the event information
      const startDate = this.currentEvent.startDate ? new Date(this.currentEvent.startDate).toLocaleDateString() : '';
      
      this.originalGameData = null; // No game data to track
      this.setInputValue('game-date', startDate);
      this.setInputValue('game-location', this.currentEvent.location || 'TBD');
      this.setInputValue('game-number', `Event: ${this.currentEvent.name}`);
      this.setInputValue('official-start-time', 'TBD');
      this.setInputValue('game-division', 'File Cabinet Event');
      this.setInputValue('actual-start-time', 'TBD');
      this.setInputValue('team1-name', 'Event Selected');
      this.setInputValue('team2-name', 'View Link Below');
      this.setInputValue('team1-score', '0.00');
      this.setInputValue('team2-score', '0.00');
      
      const comments = this.currentEvent.eventLink 
        ? `Event Link: ${this.currentEvent.eventLink}` 
        : `${this.currentEvent.name} - Status: ${this.currentEvent.status}`;
      this.setInputValue('game-comments', comments);
    }
  }

  setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  }

  updateGameNavigation() {
    const prevBtn = document.getElementById('prev-game');
    const nextBtn = document.getElementById('next-game');

    // Enable/disable navigation based on schedule data
    if (this.currentSchedule && this.currentSchedule.games && this.currentSchedule.games.length > 0) {
      // Enable navigation through schedule games
      if (prevBtn) {
        prevBtn.disabled = this.currentGameIndex <= 0;
      }
      if (nextBtn) {
        nextBtn.disabled = this.currentGameIndex >= this.currentSchedule.games.length - 1;
      }
    } else {
      // No schedule loaded - disable navigation
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    }
  }

  clearGameDisplay() {
    // Clear all game fields to default values
    const fields = [
      'game-date', 'game-location', 'game-number', 'official-start-time', 
      'game-division', 'actual-start-time', 'team1-name', 'team2-name', 
      'team1-score', 'team2-score', 'game-comments'
    ];
    
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        if (fieldId.includes('score')) {
          field.value = '0.00';
        } else if (fieldId === 'game-date') {
          field.value = 'MM/DD/YYYY';
        } else if (fieldId === 'official-start-time' || fieldId === 'actual-start-time') {
          field.value = 'XX:XX AM';
        } else {
          field.value = 'XXXXXXXXXXXXXXX';
        }
      }
    });
  }

  showNotification(type, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `gols-notification gols-notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
      <button class="gols-notification-close">&times;</button>
    `;

    // Add to notifications area
    const notificationsArea = document.getElementById('notifications-area');
    if (notificationsArea) {
      notificationsArea.appendChild(notification);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);

      // Add close button functionality
      const closeBtn = notification.querySelector('.gols-notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        });
      }
    }
  }

  showDemoNotifications() {
    setTimeout(() => {
      this.showNotification('info', 'GOLS Widget Demo Mode Active');
    }, 1000);
    
    setTimeout(() => {
      this.showNotification('success', 'UI components loaded successfully');
    }, 2000);
  }

  toggleSettings(show) {
    const settingsOverlay = document.getElementById('settings-overlay');
    if (!settingsOverlay) return;
    
    if (show !== undefined) {
      settingsOverlay.style.display = show ? 'flex' : 'none';
    } else {
      const isVisible = settingsOverlay.style.display !== 'none';
      settingsOverlay.style.display = isVisible ? 'none' : 'flex';
    }
  }
  
  handleGameDataChange() {
    // Check if we have original data to compare against
    if (this.originalGameData && this.currentSchedule) {
      const changes = this.detectGameChanges();
      if (changes && Object.keys(changes).length > 0) {
        // Visual feedback that changes are pending
        const changedFields = Object.keys(changes).length;
        console.log('📝 Game data changes detected:', changes);
        
        // You could add visual indicators here (e.g., highlight changed fields)
        // For now, just log the changes
      }
    }
  }

  /**
   * Load schedule for the selected stream
   */
  async loadScheduleForStream(stream) {
    if (!stream || !this.currentEvent) {
      return;
    }

    try {
      console.log(`📅 Loading schedule for stream: ${stream.label}`);
      
      // Convert date from MM/DD/YYYY to YYYY-MM-DD format for API
      const apiDate = this.fileCabinetAPI.convertToAPIDateFormat(stream.date);
      if (!apiDate) {
        throw new Error('Invalid date format in stream data');
      }

      // Load schedule from the event's ops sheet
      this.currentSchedule = await this.fileCabinetAPI.getScheduleFromOpsSheet(
        this.currentEvent.eventLink,
        apiDate,
        stream.facility
      );

      console.log(`✅ Loaded schedule with ${this.currentSchedule.totalGames || 0} games`);
      
      // Find first game (chronologically first OR first incomplete)
      this.currentGameIndex = this.findFirstGameIndex();
      
      // Update display
      this.updateGameDisplay();
      this.updateGameNavigation();
      
      this.showNotification('success', `Loaded ${this.currentSchedule.totalGames || 0} games for ${stream.facility} on ${stream.date}`);
      
    } catch (error) {
      console.error('❌ Failed to load schedule for stream:', error);
      this.currentSchedule = null;
      this.currentGameIndex = 0;
      this.updateGameDisplay();
      this.updateGameNavigation();
      
      this.showNotification('error', `Failed to load schedule: ${error.message}`);
    }
  }

  /**
   * Find the first game index (chronologically first OR first incomplete)
   */
  findFirstGameIndex() {
    if (!this.currentSchedule || !this.currentSchedule.games || this.currentSchedule.games.length === 0) {
      return 0;
    }

    const games = this.currentSchedule.games;
    
    // First, try to find the first incomplete game
    const firstIncompleteIndex = games.findIndex(game => {
      // Game is incomplete if it doesn't have final scores for both teams
      const team1Score = game.team1Score || game.homeScore || '';
      const team2Score = game.t2Score || game.awayScore || '';
      
      return !team1Score || !team2Score || team1Score === '' || team2Score === '' || 
             team1Score === '0' && team2Score === '0';
    });
    
    // If we found an incomplete game, use that
    if (firstIncompleteIndex >= 0) {
      return firstIncompleteIndex;
    }
    
    // Otherwise, return the first game (index 0)
    return 0;
  }

  /**
   * Handle refresh schedule button click
   */
  async handleRefreshSchedule() {
    const streamSelector = document.getElementById('stream-selector');
    const selectedStreamId = streamSelector?.value;
    
    if (!selectedStreamId || !this.currentEvent) {
      this.showNotification('warning', 'Please select an event and stream first');
      return;
    }

    try {
      console.log('🔄 Refreshing schedule...');
      
      // Find the selected stream
      const stream = this.currentStreams.find(s => s.id === selectedStreamId);
      if (!stream) {
        throw new Error('Selected stream not found');
      }

      // Clear cache for this schedule
      const apiDate = this.fileCabinetAPI.convertToAPIDateFormat(stream.date);
      const spreadsheetId = this.fileCabinetAPI.extractSpreadsheetId(this.currentEvent.eventLink);
      const cacheKey = `schedule-${spreadsheetId}-${apiDate}-${stream.facility}`;
      this.fileCabinetAPI.cache.delete(cacheKey);

      // Reload the schedule
      await this.loadScheduleForStream(stream);
      
      console.log('✅ Schedule refreshed successfully');
      
    } catch (error) {
      console.error('❌ Failed to refresh schedule:', error);
      this.showNotification('error', `Failed to refresh schedule: ${error.message}`);
    }
  }

  /**
   * Check for changes in editable fields compared to original data
   * @returns {object|null} - Object with changes or null if no changes
   */
  detectGameChanges() {
    if (!this.originalGameData || !this.currentSchedule) {
      return null;
    }

    const changes = {};
    const editableFields = [
      'actual-start-time', 'team1-name', 'team2-name', 
      'team1-score', 'team2-score', 'game-comments'
    ];

    let hasChanges = false;

    editableFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        const currentValue = element.value || '';
        const originalValue = this.originalGameData[fieldId] || '';
        
        if (currentValue !== originalValue) {
          // Map UI field names to API field names
          const apiFieldName = this.mapUIFieldToAPI(fieldId);
          if (apiFieldName) {
            changes[apiFieldName] = currentValue;
            hasChanges = true;
          }
        }
      }
    });

    return hasChanges ? changes : null;
  }

  /**
   * Map UI field names to API field names for updates
   */
  mapUIFieldToAPI(uiFieldName) {
    const mapping = {
      'actual-start-time': 'actualStartTime',
      'team1-name': 'team1',
      'team2-name': 'team2', 
      'team1-score': 't1Score',
      'team2-score': 't2Score',
      'game-comments': 'comments'
    };
    
    return mapping[uiFieldName] || null;
  }

  /**
   * Save current game changes before navigating away
   */
  async saveCurrentGameChanges() {
    if (!this.currentSchedule || !this.originalGameData || !this.currentEvent) {
      return false;
    }

    try {
      const changes = this.detectGameChanges();
      if (!changes || Object.keys(changes).length === 0) {
        console.log('🔍 No changes detected, skipping save');
        return false;
      }

      console.log('💾 Saving game changes:', changes);
      
      // Get current game data for API call parameters
      const currentGame = this.currentSchedule.games[this.currentGameIndex];
      if (!currentGame) {
        throw new Error('Current game data not found');
      }

      // Convert date to API format
      const apiDate = this.fileCabinetAPI.convertToAPIDateFormat(currentGame.date);
      if (!apiDate) {
        throw new Error('Invalid date format');
      }

      // Save to API
      await this.fileCabinetAPI.saveGameUpdates(
        this.currentEvent.eventLink,
        apiDate,
        currentGame.location || this.currentSchedule.location,
        currentGame.time,
        changes
      );

      // Update the stored schedule data with changes
      Object.keys(changes).forEach(apiField => {
        // Find the UI field that maps to this API field
        const uiFieldMapping = {
          'actualStartTime': 'actual-start-time',
          'team1': 'team1-name',
          'team2': 'team2-name',
          't1Score': 'team1-score',
          't2Score': 'team2-score',
          'comments': 'game-comments'
        };
        
        const uiField = uiFieldMapping[apiField];
        if (uiField) {
          currentGame[apiField] = changes[apiField];
          this.originalGameData[uiField] = changes[apiField];
        }
      });

      this.showNotification('success', 'Game changes saved successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to save game changes:', error);
      this.showNotification('error', `Failed to save changes: ${error.message}`);
      return false;
    }
  }

  /**
   * Save timezone offset to localStorage for future sessions
   */
  saveTimezoneOffset() {
    try {
      localStorage.setItem('gols-timezone-offset', this.timezoneOffset.toString());
    } catch (error) {
      console.warn('Failed to save timezone offset to localStorage:', error);
    }
  }

  /**
   * Load timezone offset from localStorage
   */
  loadTimezoneOffset() {
    try {
      const saved = localStorage.getItem('gols-timezone-offset');
      if (saved !== null) {
        this.timezoneOffset = parseInt(saved);
        console.log(`🕐 Loaded saved timezone offset: ${this.timezoneOffset} hours`);
        return true;
      }
    } catch (error) {
      console.warn('Failed to load timezone offset from localStorage:', error);
    }
    return false;
  }

  /**
   * Get current time in local timezone formatted as HH:MM AM/PM
   * Applies the user-configured timezone offset
   */
  getCurrentLocalTime() {
    const now = new Date();
    // Apply timezone offset
    now.setHours(now.getHours() + this.timezoneOffset);
    
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Parse time string and subtract minutes
   * @param {string} timeString - Time in format like "8:10:00 AM" or "8:10 AM"
   * @param {number} minutesToSubtract - Minutes to subtract
   * @returns {string} - Formatted time string (with timezone offset applied)
   */
  subtractMinutesFromTime(timeString, minutesToSubtract) {
    if (!timeString || timeString === 'TBD') return 'TBD';
    
    try {
      // Parse the time string
      const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (!timeMatch) return timeString; // Return original if can't parse
      
      const [, hours, minutes, seconds, ampm] = timeMatch;
      
      // Convert to 24-hour format
      let hour24 = parseInt(hours);
      if (ampm.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
      if (ampm.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
      
      // Create date object with today's date and the parsed time
      const date = new Date();
      date.setHours(hour24, parseInt(minutes), parseInt(seconds) || 0, 0);
      
      // Subtract minutes
      date.setMinutes(date.getMinutes() - minutesToSubtract);
      
      // Apply timezone offset
      date.setHours(date.getHours() + this.timezoneOffset);
      
      // Format back to 12-hour format
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.warn('Error parsing time:', timeString, error);
      return timeString; // Return original if error
    }
  }

  /**
   * Parse time string and subtract minutes WITHOUT timezone offset (for first game)
   * @param {string} timeString - Time in format like "8:10:00 AM" or "8:10 AM"
   * @param {number} minutesToSubtract - Minutes to subtract
   * @returns {string} - Formatted time string (NO timezone offset applied)
   */
  subtractMinutesFromTimeRaw(timeString, minutesToSubtract) {
    if (!timeString || timeString === 'TBD') return 'TBD';
    
    try {
      // Parse the time string
      const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (!timeMatch) return timeString; // Return original if can't parse
      
      const [, hours, minutes, seconds, ampm] = timeMatch;
      
      // Convert to 24-hour format
      let hour24 = parseInt(hours);
      if (ampm.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
      if (ampm.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
      
      // Create date object with today's date and the parsed time
      const date = new Date();
      date.setHours(hour24, parseInt(minutes), parseInt(seconds) || 0, 0);
      
      // Subtract minutes
      date.setMinutes(date.getMinutes() - minutesToSubtract);
      
      // DO NOT apply timezone offset - use raw scheduled time
      
      // Format back to 12-hour format
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.warn('Error parsing time:', timeString, error);
      return timeString; // Return original if error
    }
  }

  /**
   * Set actual start time for the first game (5 minutes before official start - NO timezone offset)
   */
  setFirstGameActualStartTime() {
    if (!this.currentSchedule || !this.currentSchedule.games || this.currentSchedule.games.length === 0) {
      return;
    }

    const firstGame = this.currentSchedule.games[0];
    if (firstGame && firstGame.time) {
      // Use raw time calculation (no timezone offset) for first game
      const actualStartTime = this.subtractMinutesFromTimeRaw(firstGame.time, 5);
      
      // Update the field
      this.setInputValue('actual-start-time', actualStartTime);
      
      // DO NOT update originalGameData here - let it keep the original value
      // This way the change will be detected and saved when navigating away
      
      console.log(`🕐 Set first game actual start time: ${actualStartTime} (5 min before scheduled ${firstGame.time}, NO timezone offset)`);
    }
  }

  /**
   * Show timezone confirmation popup on startup
   */
  async showTimezonePopup() {
    return new Promise((resolve) => {
      // Get current local time and UTC offset for display
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
      
      // Calculate current UTC offset
      const currentUTCOffset = -now.getTimezoneOffset() / 60;
      const currentUTCString = `(${currentUTCOffset >= 0 ? '+' : ''}${currentUTCOffset} UTC)`;
      const currentTimeWithUTC = `${currentTime} ${currentUTCString}`;

      // Create popup overlay
      const overlay = document.createElement('div');
      overlay.className = 'gols-timezone-overlay';

      // Create popup content
      const popup = document.createElement('div');
      popup.className = 'gols-timezone-popup';

      // Message about saved offset if one exists
      const savedMessage = this.timezoneOffset !== 0 ? 
        `<div class="gols-timezone-saved">
          <i class="fas fa-check-circle"></i> Previously saved: ${this.timezoneOffset > 0 ? '+' : ''}${this.timezoneOffset} hours
        </div>` : '';

      popup.innerHTML = `
        <div class="gols-timezone-header">
          <div class="gols-timezone-icon">
            <i class="fas fa-clock"></i>
          </div>
          <h2 class="gols-timezone-title">Time Zone Verification</h2>
          <p class="gols-timezone-subtitle">
            Your computer's current time is: <strong>${currentTimeWithUTC}</strong>
          </p>
        </div>
        
        ${savedMessage}
        
        <div class="gols-timezone-content">
          <div class="gols-timezone-question">
            <strong>Is this the correct local time for your event location?</strong>
          </div>
          <div class="gols-timezone-description">
            If your computer's time zone doesn't match the event location, 
            you can adjust it below:
          </div>
          
          <div class="gols-timezone-control-group">
            <label class="gols-timezone-label">Time Adjustment:</label>
            <select id="timezone-offset" class="gols-timezone-select">
              <option value="0">No change</option>
              <option value="-12">-12 hours</option>
              <option value="-11">-11 hours</option>
              <option value="-10">-10 hours</option>
              <option value="-9">-9 hours</option>
              <option value="-8">-8 hours</option>
              <option value="-7">-7 hours</option>
              <option value="-6">-6 hours</option>
              <option value="-5">-5 hours</option>
              <option value="-4">-4 hours</option>
              <option value="-3">-3 hours</option>
              <option value="-2">-2 hours</option>
              <option value="-1">-1 hour</option>
              <option value="1">+1 hour</option>
              <option value="2">+2 hours</option>
              <option value="3">+3 hours</option>
              <option value="4">+4 hours</option>
              <option value="5">+5 hours</option>
              <option value="6">+6 hours</option>
              <option value="7">+7 hours</option>
              <option value="8">+8 hours</option>
              <option value="9">+9 hours</option>
              <option value="10">+10 hours</option>
              <option value="11">+11 hours</option>
              <option value="12">+12 hours</option>
            </select>
          </div>
          
          <div id="preview-time" class="gols-timezone-preview">
            <strong>Adjusted Time: ${currentTimeWithUTC}</strong>
          </div>
        </div>
        
        <div class="gols-timezone-actions">
          <button id="timezone-cancel" class="gols-timezone-button gols-timezone-button-secondary">
            Cancel
          </button>
          <button id="timezone-confirm" class="gols-timezone-button gols-timezone-button-primary">
            Continue
          </button>
        </div>
      `;

      overlay.appendChild(popup);
      
      // Append to the widget container instead of body to stay within bounds
      const widgetContainer = document.getElementById('gols-widget');
      if (widgetContainer) {
        widgetContainer.appendChild(overlay);
      } else {
        document.body.appendChild(overlay);
      }

      // Pre-select the current timezone offset in the dropdown
      const offsetSelect = popup.querySelector('#timezone-offset');
      const previewDiv = popup.querySelector('#preview-time');
      offsetSelect.value = this.timezoneOffset.toString();
      
      // Update preview with current offset
      this.updateTimezonePreview(offsetSelect, previewDiv, currentTimeWithUTC);
      
      offsetSelect.addEventListener('change', () => {
        this.updateTimezonePreview(offsetSelect, previewDiv, currentTimeWithUTC);
      });

      // Handle buttons
      popup.querySelector('#timezone-confirm').addEventListener('click', () => {
        this.timezoneOffset = parseInt(offsetSelect.value);
        console.log(`🕐 Timezone offset set to: ${this.timezoneOffset} hours`);
        
        // Save the timezone offset for future sessions
        this.saveTimezoneOffset();
        
        if (this.timezoneOffset !== 0) {
          this.showNotification('info', `Time adjusted by ${this.timezoneOffset > 0 ? '+' : ''}${this.timezoneOffset} hours`);
        }
        
        const widgetContainer = document.getElementById('gols-widget');
        if (widgetContainer && widgetContainer.contains(overlay)) {
          widgetContainer.removeChild(overlay);
        } else {
          document.body.removeChild(overlay);
        }
        resolve(true);
      });

      popup.querySelector('#timezone-cancel').addEventListener('click', () => {
        const widgetContainer = document.getElementById('gols-widget');
        if (widgetContainer && widgetContainer.contains(overlay)) {
          widgetContainer.removeChild(overlay);
        } else {
          document.body.removeChild(overlay);
        }
        resolve(false);
      });

      // Handle overlay click (close)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          const widgetContainer = document.getElementById('gols-widget');
          if (widgetContainer && widgetContainer.contains(overlay)) {
            widgetContainer.removeChild(overlay);
          } else {
            document.body.removeChild(overlay);
          }
          resolve(false);
        }
      });
    });
  }

  /**
   * Update the timezone preview display
   */
  updateTimezonePreview(offsetSelect, previewDiv, originalTimeWithUTC) {
    const offset = parseInt(offsetSelect.value);
    const adjustedTime = new Date();
    adjustedTime.setHours(adjustedTime.getHours() + offset);
    
    const adjustedTimeString = adjustedTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Calculate adjusted UTC offset
    const currentUTCOffset = -new Date().getTimezoneOffset() / 60;
    const adjustedUTCOffset = currentUTCOffset + offset;
    const adjustedUTCString = `(${adjustedUTCOffset >= 0 ? '+' : ''}${adjustedUTCOffset} UTC)`;
    
    if (offset === 0) {
      previewDiv.innerHTML = `<strong>Adjusted Time: ${originalTimeWithUTC}</strong>`;
    } else {
      const offsetDisplay = offset > 0 ? `+${offset}h` : `${offset}h`;
      previewDiv.innerHTML = `<strong>Adjusted Time: ${adjustedTimeString} (${offsetDisplay}) ${adjustedUTCString}</strong>`;
    }
  }
}

// Make UIManager available globally
window.UIManager = UIManager;
