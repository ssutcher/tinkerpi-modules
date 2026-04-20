# Multi-Page Navigation

Turn your MagicMirror into a swipeable multi-page dashboard. Each module gets assigned to a page, and you swipe left/right (on a touchscreen) or use notifications to switch between them.

Uses three third-party modules:
- **[MMM-pages](https://github.com/edward-shen/MMM-pages)** — page management and module grouping
- **[MMM-page-indicator](https://github.com/edward-shen/MMM-page-indicator)** — dot indicators showing which page you're on
- **[MMM-Touch](https://github.com/ghaak/MMM-Touch)** — touchscreen swipe gestures (optional, for touchscreens)

## Installation

### 1. Install the modules

Run these from your MagicMirror directory:

```bash
cd ~/MagicMirror/modules

# Page manager
git clone https://github.com/edward-shen/MMM-pages.git

# Page indicator dots
git clone https://github.com/edward-shen/MMM-page-indicator.git

# Touch gestures (optional — only needed for touchscreens)
git clone https://github.com/ghaak/MMM-Touch.git
```

No `npm install` needed for any of these.

### 2. Add to config.js

Add these three module entries to the top of your `modules` array in `~/MagicMirror/config/config.js`:

```javascript
modules: [
    // --- Page Navigation ---
    {
        module: "MMM-pages",
        config: {
            modules: [["page1"], ["page2"]],   // Add more pages: ["page3"], etc.
            fixed: ["MMM-page-indicator", "MMM-Touch"],
            animationTime: 250,
        },
    },
    {
        module: "MMM-page-indicator",
        position: "bottom_bar",
        classes: "fixed_page",
        config: {
            pages: 2,                          // Must match number of pages above
            activeBright: true,
            inactiveDimmed: true,
            inactiveHollow: true,
        },
    },
    {
        module: "MMM-Touch",
        position: "bottom_center",
        config: {
            useDisplay: false,
            threshold: {
                moment_ms: 500,
                press_ms: 3000,
                move_px: 30,
                pinch_px: 50,
                rotate_dg: 20,
                idle_ms: 30000,
            },
            gestureCommands: {
                default: {
                    SWIPE_LEFT_1: (commander) => {
                        commander.sendNotification("PAGE_INCREMENT");
                    },
                    SWIPE_RIGHT_1: (commander) => {
                        commander.sendNotification("PAGE_DECREMENT");
                    },
                },
            },
        },
    },

    // --- Your modules go here, with classes to assign them to pages ---
]
```

### 3. Assign modules to pages

Each of your modules gets a `classes` property that assigns it to a page. For example:

```javascript
// Page 1: Phish countdown
{
    module: "MMM-Phish",
    position: "fullscreen_above",
    classes: "page1",
    config: {
        apiKey: "YOUR_PHISHNET_API_KEY",
        updateInterval: 15 * 60 * 1000,
    },
},

// Page 2: Goose countdown
{
    module: "MMM-Goose",
    position: "fullscreen_above",
    classes: "page2",
    config: {
        updateInterval: 15 * 60 * 1000,
    },
},
```

The `classes` value (`"page1"`, `"page2"`, etc.) must match the page names in the `MMM-pages` config's `modules` array.

## Adding more pages

1. Add a new entry to the `modules` array in MMM-pages config:
   ```javascript
   modules: [["page1"], ["page2"], ["page3"]],  // added page3
   ```

2. Update the page count in MMM-page-indicator:
   ```javascript
   pages: 3,  // was 2
   ```

3. Add your new module with `classes: "page3"`.

## How it works

- **MMM-pages** watches for `PAGE_INCREMENT` / `PAGE_DECREMENT` notifications and shows/hides modules based on their CSS class
- **MMM-Touch** listens for swipe gestures on the touchscreen and sends those notifications
- **MMM-page-indicator** shows dots at the bottom so you know which page you're on
- Modules with `classes: "fixed_page"` stay visible on all pages (like the page indicator itself)

## Without a touchscreen

If you don't have a touchscreen, you can skip MMM-Touch entirely. Pages can still be controlled by:
- Other modules sending `PAGE_INCREMENT` / `PAGE_DECREMENT` notifications
- Physical buttons via a GPIO bridge (see the gpio section of this repo when available)
- The MagicMirror remote control module

## Tips

- **Animation glitches?** Try increasing `animationTime` (default 250ms)
- **Module showing on wrong page?** Check that the `classes` value exactly matches a page name in MMM-pages config
- **Module showing on ALL pages?** It's missing the `classes` property — add one
- **Page indicator not updating?** Make sure `pages` count matches the number of page arrays in MMM-pages
