/**
 * UI Module - Barrel File
 * Re-exports all UI functionality for convenient importing
 */

// Utilities
export { showNotification } from './utils/notifications.js';

// Autocomplete
export { setupAutocomplete, findBestMatch } from './ui/autocomplete.js';

// Layovers
export { setupLayoverControls, getLayovers, canAddMoreStops, updateAddButtonState } from './ui/layovers.js';

// Drag & Drop
export { setupDragItems } from './ui/dragdrop.js';

// Collapse/Expand
export { collapseStops, expandStops } from './ui/collapse.js';

// Flight Info
export { enableSearch, updateFlightInfo } from './ui/flightInfo.js';
