/**
 * Widget API Routes
 * Provides endpoints for the frontend to consume File Cabinet data
 */

import express from 'express';
import { FileCabinetService } from '../services/fileCabinetService.js';

const router = express.Router();
const fileCabinetService = new FileCabinetService();

/**
 * GET /api/widget/events
 * Get events formatted for the widget (simplified interface)
 */
router.get('/widget/events', async (req, res) => {
  try {
    // Default to first available tab if none specified
    const tabs = await fileCabinetService.getAvailableTabs();
    if (tabs.length === 0) {
      return res.json([]);  // Empty events array if no tabs
    }
    
    const firstTab = tabs[0];
    const fileCabinetData = await fileCabinetService.getEvents(firstTab.name);
    const widgetEvents = fileCabinetService.convertToWidgetFormat(fileCabinetData);
    
    res.json(widgetEvents);
  } catch (error) {
    console.error('Error fetching widget events:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/widget/refresh
 * Clear cache and refresh widget data
 */
router.post('/widget/refresh', async (req, res) => {
  try {
    fileCabinetService.clearCache();
    res.json({ success: true });
  } catch (error) {
    console.error('Error refreshing widget cache:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/tabs
 * Get available File Cabinet tabs
 */
router.get('/tabs', async (req, res) => {
  try {
    const tabs = await fileCabinetService.getAvailableTabs();
    res.json({
      success: true,
      data: tabs
    });
  } catch (error) {
    console.error('Error fetching tabs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/events
 * Get events from a specific tab
 * Query params: tab (required), dateFilter (optional), sheetId (optional)
 */
router.get('/events', async (req, res) => {
  try {
    const { tab, dateFilter = 'all', sheetId } = req.query;
    
    if (!tab) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Tab parameter is required'
        }
      });
    }

    // Get data from File Cabinet API
    const fileCabinetData = await fileCabinetService.getEvents(tab, dateFilter, sheetId);
    
    // Convert to widget format
    const widgetEvents = fileCabinetService.convertToWidgetFormat(fileCabinetData);
    
    res.json({
      success: true,
      data: widgetEvents,
      metadata: {
        tab,
        dateFilter,
        totalEvents: widgetEvents.length,
        generatedAt: new Date().toISOString(),
        source: 'file-cabinet-api'
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/refresh
 * Clear cache and refresh data
 */
router.post('/refresh', async (req, res) => {
  try {
    const { tab, dateFilter, sheetId } = req.body;
    
    // Clear specific cache or all cache
    if (tab) {
      const cacheKey = `file-cabinet:${tab}:${dateFilter || 'all'}:${sheetId || 'default'}`;
      fileCabinetService.clearCache(cacheKey);
    } else {
      fileCabinetService.clearCache();
    }
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
