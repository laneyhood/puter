# Profile Picture Feature Research Summary

Based on my exploration of the codebase, here's how the profile picture feature currently works and where you'll need to make changes:

## Current Architecture Overview

### 1. UI Structure & Rendering
- **Main UI File**: `src/gui/src/UI/Settings/UITabAccount.js`
- **Profile Picture Display**: Lines 37-40 show the profile picture is rendered as a centered div with background-image
- **Current Structure**: The profile picture is displayed in a flex container with `align-items: center` for centering

### 2. Profile Picture Storage & Management
- **Storage Method**: Profile pictures are stored as base64 data in a JSON file at `/{username}/Public/.profile`
- **Update Function**: `window.update_profile()` in `src/gui/src/helpers.js` (lines 2629-2654) handles profile updates
- **Data Flow**: 
  1. User uploads image → File dialog opens
  2. Image is resized to 150x150 and converted to base64
  3. `update_profile()` writes the base64 data to the `.profile` file
  4. UI is updated immediately

### 3. Event Handling Pattern
- **File Upload**: Lines 137-151 in `UITabAccount.js` handle the profile picture click
- **File Processing**: Lines 153-179 handle the `file_opened` event
- **Event Registration**: All event handlers are registered in the `init()` function

### 4. Button Styling System
- **Danger Button Class**: `.button-danger` (lines 271-276 in `style.css`)
- **Styling**: Red gradient background (`#f83434` to `#f00808`) with white text
- **Usage Pattern**: Other danger buttons like "Delete Account" use this class

### 5. Internationalization System
- **Function**: `i18n()` function in `src/gui/src/i18n/i18n.js`
- **Available Keys**: The system has `delete`, `remove_from_taskbar` keys available
- **Pattern**: All UI text uses `i18n('key_name')` for translation support

## Implementation Plan

To add the "Remove Profile Picture" button, you'll need to:

### 1. UI Changes (UITabAccount.js)
- Add a remove button in the profile picture container (lines 37-40)
- Make it conditionally visible only when a profile picture exists
- Style it as a danger button and center it below the profile picture

### 2. Event Handling
- Add a click handler in the `init()` function (around line 86)
- Create a function to clear the profile picture data
- Update the UI to hide the button and reset to default avatar

### 3. Data Management
- Use the existing `update_profile()` function to clear the picture data
- Update both the settings window and the global profile image elements

### 4. Internationalization
- Add a new translation key for "Remove Profile Picture" or use existing "remove" key

## Key Files to Modify
1. **`src/gui/src/UI/Settings/UITabAccount.js`** - Main implementation
2. **`src/gui/src/i18n/translations/en.js`** - Add translation key (if needed)
3. **Other language files** - Add translations for the new key

## Consistent Patterns to Follow
- Use the same event handling pattern as other buttons in the file
- Follow the same styling approach as the "Delete Account" button
- Use the existing `update_profile()` function for data persistence
- Maintain the same UI structure and centering approach

The architecture is well-structured and follows consistent patterns, making it straightforward to add the remove functionality while maintaining code consistency.

## Issue Requirements Summary
- **Feature**: Add "Remove Profile Picture" button
- **Behavior**: 
  - Button appears only when user has uploaded a profile picture
  - Button disappears after user removes their picture
  - Button should match other "danger" style buttons
  - Button should be centered beneath the profile picture
- **Current State**: Users can upload profile pictures but cannot remove them
- **Expected State**: Users can both upload and remove profile pictures, reverting to default avatar

---

# Sidebar Header Text Contrast Fix Summary

## GitHub Issue
**Problem**: Sidebar header texts in the explorer become unreadable due to poor contrast between text and background colors when adjusting theme lightness levels.

## Root Cause Analysis
- **Current Implementation**: Sidebar title text uses hardcoded color `#8f96a3` in CSS
- **Theme System**: Dynamic theme system exists but sidebar titles don't use it
- **Existing Infrastructure**: `--window-sidebar-color` CSS variable is defined but unused

## Architecture Research Findings
### Theme System Flow
1. **User Input** → Lightness slider in `UIWindowThemeDialog`
2. **Logic** → `light_text = lightness < 60` boolean calculation
3. **CSS Variables** → `--primary-color` updates dynamically (`white` or `#373e44`)
4. **Cascade** → `--window-sidebar-color` inherits from `--primary-color`
5. **Components** → Other UI elements already use this system

### Key Files
- **ThemeService**: `src/gui/src/services/ThemeService.js` - Manages theme state and CSS variables
- **Theme Dialog**: `src/gui/src/UI/UIWindowThemeDialog.js` - UI for theme adjustments
- **CSS Variables**: `src/gui/src/css/style.css` - CSS custom properties system

## Solution
**Approach**: Leverage existing `--window-sidebar-color` variable that's already defined but unused.

### Implementation
**File**: `src/gui/src/css/style.css`  
**Line**: ~1221  
**Change**: 
```css
/* Before */
.window-sidebar-title {
    color: #8f96a3;
}

/* After */
.window-sidebar-title {
    color: var(--window-sidebar-color, #8f96a3);
}
```

## Why This Solution
- **Minimal Change**: Single line modification
- **Architecturally Consistent**: Uses existing theme infrastructure
- **Targeted Fix**: Addresses only the specific issue (sidebar headers)
- **Maintains Fallback**: Original color as backup
- **No Service Changes**: Leverages existing CSS variable cascade

## Result
Sidebar header text will now dynamically adjust color based on theme lightness:
- **Light themes** (lightness ≥ 60): Dark text (`#373e44`)
- **Dark themes** (lightness < 60): Light text (`white`)
- **Automatic**: Updates instantly when user adjusts theme settings

## WCAG Compliance Enhancement (Optional but Recommended)

To guarantee WCAG AA contrast (≥ 4.5:1 for 13px text), we add a small routine in `ThemeService.reload_()` to compute the sidebar background luminance from current HSL and pick the best-contrast text color, writing it to `--window-sidebar-color`.

### Rationale
- Ensures sidebar header text changes color at exactly the same threshold as other UI elements (window titles, taskbar).
- Uses the same `light_text` logic that drives the rest of the theme system.
- Minimal implementation that maintains perfect sync with existing UI behavior.

### Final Implementation (kept)
```javascript
// In ThemeService.reload_() - simple sync with primary color
const primary = s.light_text ? '#ffffff' : '#373e44';
this.root.style.setProperty('--window-sidebar-color', primary);
```

### CSS (unchanged from fix)
```css
.window-sidebar-title { color: var(--window-sidebar-color, #8f96a3); }
```

### Outcome
- Sidebar header text changes color in perfect sync with other UI elements (window titles, taskbar).
- Maintains the same `light_text` threshold behavior as the rest of the theme system.
- Simple, reliable solution that leverages existing architecture.

---

# Top Toolbar Auto-Hide Feature Implementation Summary

## GitHub Issue
**Problem**: Top toolbar is permanently visible, consuming valuable screen space. Need auto-hide functionality that hides toolbar after inactivity and shows it when mouse moves near top edge.

## Current Architecture Overview

### 1. UI Rendering Structure
- **Main Entry Point**: `src/gui/src/initgui.js` - Initializes the entire GUI system
- **Desktop Creation**: `src/gui/src/UI/UIDesktop.js` - Creates the desktop and toolbar
- **Toolbar Creation**: Lines 1105-1146 in `UIDesktop.js` - Builds the toolbar HTML and inserts it before the desktop

### 2. Toolbar Implementation
- **HTML Structure**: The toolbar is created as a `<div class="toolbar">` element with various buttons
- **CSS Styling**: `src/gui/src/css/style.css` lines 1738-1752 define the toolbar appearance
- **Positioning**: The toolbar is positioned at the top with `z-index: 999999`
- **Height**: Fixed at 30px (`window.toolbar_height = 30`)

### 3. Event Handling System
- **Mouse Events**: `src/gui/src/initgui.js` lines 1151-1218 handle mouse events globally
- **Mouse Position Tracking**: `src/gui/src/helpers/update_mouse_position.js` tracks mouse coordinates
- **Event Registration**: Mouse events are bound to `$(document)` for global coverage

### 4. Layout Management
- **Window Container**: Positioned below toolbar using `$('.window-container').css('top', window.toolbar_height)`
- **Desktop Height**: Calculated as `window.innerHeight - window.toolbar_height - window.taskbar_height`
- **Responsive Updates**: Window resize events recalculate positions based on toolbar height

## Implementation Plan

### 1. CSS Changes (`src/gui/src/css/style.css`)
```css
.toolbar {
    /* existing styles */
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

.toolbar.auto-hidden {
    transform: translateY(-100%);
    opacity: 0;
}

.toolbar.auto-show {
    transform: translateY(0);
    opacity: 1;
}
```

### 2. JavaScript Logic (`src/gui/src/initgui.js`)
- Add mouse move event listener for proximity detection
- Add timeout management for auto-hide (2-second delay)
- Add state management for toolbar visibility
- Handle mouse proximity to top edge (50px threshold)

### 3. State Management
- Track toolbar visibility state
- Manage auto-hide timeout
- Handle mouse proximity to top edge
- Dynamically adjust window container position when toolbar hides/shows

### 4. Key Files to Modify
1. **`src/gui/src/UI/UIDesktop.js`** - Toolbar creation and DOM insertion
2. **`src/gui/src/css/style.css`** - Auto-hide CSS classes and transitions
3. **`src/gui/src/initgui.js`** - Global mouse event handling and auto-hide logic
4. **`src/gui/src/helpers/update_mouse_position.js`** - Mouse position tracking (could be extended)

## Event Flow for Auto-Hide
1. **Mouse Movement** → `initgui.js` line 1216-1218
2. **Proximity Detection** → Check if mouse is within 50px of top edge
3. **Timeout Management** → 2-second delay before hiding
4. **CSS Transitions** → Smooth fade/slide animations
5. **Layout Updates** → Adjust window container positioning

## Expected Behavior
- Toolbar automatically hides after 2 seconds of inactivity
- Toolbar reappears when mouse moves near the top edge of the screen (top 50px)
- Smooth fade/slide animation for hiding and showing
- Maintains full functionality when visible
- Optional setting to toggle auto-hide on/off

## Integration Points
- **Settings Integration**: Could add a setting to toggle auto-hide on/off
- **Mobile Considerations**: May need different behavior for mobile devices
- **Fullscreen Mode**: Should work with existing fullscreen functionality
- **Window Management**: Must not interfere with window snapping and positioning

This implementation will provide a clean, user-friendly auto-hide feature that maximizes screen real estate while maintaining easy access to toolbar functionality.