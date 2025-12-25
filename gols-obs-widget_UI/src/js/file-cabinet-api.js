/**
 * File Cabinet API Service
 * Direct browser calls to the production File Cabinet API
 * Replaces mock data with real event data
 */

class FileCabinetAPIService {
  constructor() {
    // Production File Cabinet API base URL
    this.baseUrl = 'https://file-cabinet-api-s3afg2f2mq-uc.a.run.app';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get available tabs from the File Cabinet
   */
  async getAvailableTabs() {
    const cacheKey = 'tabs';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/tabs`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const tabs = data.data || data; // Handle different response formats
      
      this.setCache(cacheKey, tabs);
      return tabs;
    } catch (error) {
      console.error('Failed to fetch File Cabinet tabs:', error);
      throw error;
    }
  }

  /**
   * Get events from a specific tab
   * @param {string} tabName - Name of the tab to fetch from
   * @param {string} dateFilter - Date filter ('future', 'past', 'all')
   */
  async getEvents(tabName = '2026 OPS SHEET LINKS', dateFilter = 'future') {
    const cacheKey = `events-${tabName}-${dateFilter}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${this.baseUrl}/file-cabinet`);
      url.searchParams.set('tab', tabName);
      if (dateFilter !== 'all') {
        url.searchParams.set('dateFilter', dateFilter);
      }

      console.log(`🌐 Fetching events from: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // No credentials needed for this public API
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      const events = data.data || [];
      
      console.log(`✅ Received ${events?.length || 0} events from File Cabinet`);
      
      this.setCache(cacheKey, events);
      return events;
    } catch (error) {
      console.error('Failed to fetch File Cabinet events:', error);
      
      // Provide more specific error information
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Network error - likely CORS or connectivity issue');
        error.message = 'Network error: Unable to connect to File Cabinet API (CORS or connectivity issue)';
      }
      
      throw error;
    }
  }

  /**
   * Convert File Cabinet events to UI format
   * Maps File Cabinet data structure to the format expected by the UI
   */
  convertEventsToUIFormat(fileCabinetEvents) {
    if (!Array.isArray(fileCabinetEvents)) {
      console.warn('Expected array of events, got:', fileCabinetEvents);
      return [];
    }

    return fileCabinetEvents.map(event => {
      // Map File Cabinet event structure to UI format
      // File Cabinet provides: eventName, eventLink, startDate, endDate, status
      return {
        id: `fc-${event.eventName.replace(/\s+/g, '-').toLowerCase()}-${event.startDate}`,
        name: event.eventName,
        startDate: event.startDate,
        endDate: event.endDate,
        location: 'TBD', // File Cabinet doesn't provide location for these events
        eventLink: event.eventLink,
        status: event.status,
        // Add empty games array - will be populated when event is selected
        games: []
      };
    });
  }

  /**
   * Format event for dropdown display
   * Format: "Start Date - End Date: Event Name"
   */
  formatEventForDropdown(event) {
    const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString() : '';
    const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString() : '';
    
    let dateRange = startDate;
    if (endDate && endDate !== startDate) {
      dateRange = `${startDate} - ${endDate}`;
    }
    
    return `${dateRange}: ${event.name}`;
  }

  /**
   * Get site info from an ops sheet
   * @param {string} opsSheetUrl - The URL to the ops sheet
   */
  async getSiteInfoFromOpsSheet(opsSheetUrl) {
    if (!opsSheetUrl) {
      throw new Error('Ops sheet URL is required');
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = this.extractSpreadsheetId(opsSheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const cacheKey = `site-info-${spreadsheetId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/operations/${spreadsheetId}/site-info`;
      console.log(`🌐 Fetching site info from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      const siteInfo = data.data?.siteInfo || [];
      console.log(`✅ Received ${siteInfo.length} site info records`);
      
      this.setCache(cacheKey, siteInfo);
      return siteInfo;
    } catch (error) {
      console.error('Failed to fetch site info from ops sheet:', error);
      throw error;
    }
  }

  /**
   * Extract spreadsheet ID from Google Sheets URL
   * @param {string} url - Google Sheets URL
   * @returns {string|null} - Extracted spreadsheet ID
   */
  extractSpreadsheetId(url) {
    if (!url) return null;
    
    // Match pattern: /spreadsheets/d/{SPREADSHEET_ID}/
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Convert site info to Stream dropdown format
   * Format: "DATE - Facility - Computer"
   * @param {Array} siteInfoArray - Array of site info records
   * @returns {Array} - Array of formatted stream options
   */
  convertSiteInfoToStreamFormat(siteInfoArray) {
    if (!Array.isArray(siteInfoArray)) {
      console.warn('Expected array of site info, got:', siteInfoArray);
      return [];
    }

    return siteInfoArray
      .filter(site => {
        // Only include records that have the required fields
        return site.date && site.facility && site.computer;
      })
      .map(site => {
        // Format the date for display
        let displayDate = site.date;
        if (site.parsedDate) {
          const date = new Date(site.parsedDate);
          displayDate = date.toLocaleDateString();
        }

        return {
          id: `${site.date}-${site.facility}-${site.computer}`.replace(/\s+/g, '-').toLowerCase(),
          label: `${displayDate} - ${site.facility} - ${site.computer}`,
          date: site.date,
          facility: site.facility,
          computer: site.computer,
          channel: site.channel,
          rawSiteInfo: site
        };
      })
      .sort((a, b) => {
        // Sort by date first, then facility, then computer
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        if (a.facility !== b.facility) {
          return a.facility.localeCompare(b.facility);
        }
        return a.computer.localeCompare(b.computer);
      });
  }

  /**
   * Get schedule from an ops sheet
   * @param {string} opsSheetUrl - The URL to the ops sheet
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} location - Location/facility name
   */
  async getScheduleFromOpsSheet(opsSheetUrl, date, location) {
    if (!opsSheetUrl || !date || !location) {
      throw new Error('Ops sheet URL, date, and location are required');
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = this.extractSpreadsheetId(opsSheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const cacheKey = `schedule-${spreadsheetId}-${date}-${location}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${this.baseUrl}/operations/${spreadsheetId}/schedule`);
      url.searchParams.set('date', date);
      url.searchParams.set('location', location);
      
      console.log(`🌐 Fetching schedule from: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      const scheduleData = data.data || {};
      console.log(`✅ Received schedule with ${scheduleData.totalGames || 0} games`);
      
      // Store in both memory cache and IndexedDB
      this.setCache(cacheKey, scheduleData);
      await this.storeScheduleInDB(spreadsheetId, date, location, scheduleData);
      
      return scheduleData;
    } catch (error) {
      console.error('Failed to fetch schedule from ops sheet:', error);
      
      // Try to get from IndexedDB as fallback
      try {
        const fallbackData = await this.getScheduleFromDB(spreadsheetId, date, location);
        if (fallbackData) {
          console.log('📋 Using cached schedule from IndexedDB');
          return fallbackData;
        }
      } catch (dbError) {
        console.warn('Failed to get fallback data from IndexedDB:', dbError);
      }
      
      throw error;
    }
  }

  /**
   * Save game updates to the ops sheet via PATCH API
   * @param {string} opsSheetUrl - The URL to the ops sheet
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} location - Location/facility name
   * @param {string} time - Game time
   * @param {object} updates - Object with field updates
   */
  async saveGameUpdates(opsSheetUrl, date, location, time, updates) {
    if (!opsSheetUrl || !date || !location || !time || !updates) {
      throw new Error('All parameters are required for saving game updates');
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = this.extractSpreadsheetId(opsSheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    try {
      const url = `${this.baseUrl}/operations/${spreadsheetId}/schedule`;
      
      const requestBody = {
        date: date,
        location: location,
        time: time,
        updates: updates
      };
      
      console.log(`💾 Saving game updates to: ${url}`);
      console.log('Updates:', updates);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      console.log('✅ Game updates saved successfully');
      return data;
    } catch (error) {
      console.error('Failed to save game updates:', error);
      throw error;
    }
  }

  /**
   * Convert date from MM/DD/YYYY to YYYY-MM-DD format
   */
  convertToAPIDateFormat(dateString) {
    if (!dateString) return null;
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const [, month, day, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
  }

  /**
   * IndexedDB operations for offline storage
   */
  async initDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GOLSScheduleDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create schedule store
        if (!db.objectStoreNames.contains('schedules')) {
          const store = db.createObjectStore('schedules', { keyPath: 'id' });
          store.createIndex('spreadsheetId', 'spreadsheetId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('location', 'location', { unique: false });
        }
      };
    });
  }

  async storeScheduleInDB(spreadsheetId, date, location, scheduleData) {
    try {
      await this.initDB();
      const transaction = this.db.transaction(['schedules'], 'readwrite');
      const store = transaction.objectStore('schedules');
      
      const record = {
        id: `${spreadsheetId}-${date}-${location}`,
        spreadsheetId,
        date,
        location,
        scheduleData,
        timestamp: Date.now()
      };
      
      await new Promise((resolve, reject) => {
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log('💾 Schedule stored in IndexedDB');
    } catch (error) {
      console.warn('Failed to store schedule in IndexedDB:', error);
    }
  }

  async getScheduleFromDB(spreadsheetId, date, location) {
    try {
      await this.initDB();
      const transaction = this.db.transaction(['schedules'], 'readonly');
      const store = transaction.objectStore('schedules');
      
      const record = await new Promise((resolve, reject) => {
        const request = store.get(`${spreadsheetId}-${date}-${location}`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      return record ? record.scheduleData : null;
    } catch (error) {
      console.warn('Failed to get schedule from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Simple cache implementation
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export for use in UI Manager
window.FileCabinetAPIService = FileCabinetAPIService;
