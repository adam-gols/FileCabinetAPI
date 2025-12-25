/**
 * GOLS UI Widget - Main Entry Point
 * Initializes the widget when the page loads
 */

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 GOLS UI Widget starting...');
  
  try {
    // Create and initialize the UI Manager
    const uiManager = new UIManager();
    await uiManager.initialize();
    
    console.log('✅ GOLS UI Widget loaded successfully');
    
    // Make UI manager available globally for debugging
    window.golsUI = uiManager;
    
  } catch (error) {
    console.error('❌ Failed to initialize GOLS UI Widget:', error);
    
    // Show error in the widget
    const widget = document.getElementById('gols-widget');
    if (widget) {
      widget.innerHTML = `
        <div class="gols-error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Widget Load Error</h3>
          <p>Failed to initialize the GOLS UI Widget.</p>
          <pre>${error.message}</pre>
          <button onclick="window.location.reload()" class="gols-button gols-button-primary">
            Reload Widget
          </button>
        </div>
      `;
    }
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  console.log('🔄 GOLS UI Widget shutting down...');
});
