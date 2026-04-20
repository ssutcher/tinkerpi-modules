# MMM-Phish

A MagicMirror² module that shows a countdown to the next Phish show, the most recent setlist, and "on this day" historical shows.

## Features

- **Countdown timer** to the next upcoming show (days, hours, minutes, seconds)
- **Tonight mode** — switches to a gold-themed countdown when the show is today
- **Live mode** — pulsing red indicator when the show has started, displays setlist as it comes in
- **Last setlist** — most recent show's setlist grouped by set (S1, S2, E, etc.)
- **On This Day** — random historical Phish show from today's date
- Retro CRT terminal aesthetic (green text, glowing effects, monospace fonts)

## Screenshots

The module has four visual states:

| State | When |
|-------|------|
| Between shows | Next show is 1+ days away — big day counter |
| Tonight | Show day, hours counting down — gold glow theme |
| Live | Past showtime — red pulsing "Live" badge |
| No shows | No upcoming shows scheduled |

## Installation

1. Copy this folder into your MagicMirror modules directory:

```bash
cp -r MMM-Phish ~/MagicMirror/modules/
```

2. No npm dependencies required.

3. Get a free API key from [phish.net](https://phish.net/api) (sign up, request a key).

4. Add this to your `~/MagicMirror/config/config.js` in the `modules` array:

```javascript
{
    module: "MMM-Phish",
    position: "fullscreen_above",
    config: {
        apiKey: "YOUR_PHISHNET_API_KEY",
        updateInterval: 15 * 60 * 1000, // 15 minutes
    },
},
```

5. Restart MagicMirror.

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | `""` | **Required.** Your phish.net v5 API key |
| `updateInterval` | `900000` (15 min) | How often to fetch new data from the API (ms) |

## Position

This module is designed to be **fullscreen** — use `position: "fullscreen_above"`. It takes over the entire viewport with its own layout.

You can also use it in a smaller region (`top_left`, `bottom_right`, etc.) but the styling is optimized for fullscreen on a 5" display (720x480) or 1280x720.

## API

Uses the [phish.net v5 API](https://phish.net/api):

- Shows by year — finds the next upcoming show
- Setlists by year — gets the most recent setlist
- Shows by month — finds "on this day" historical shows

The API is free. Rate limits are generous for the 15-minute update interval.

## How it works

- `node_helper.js` fetches data from phish.net every 15 minutes
- `MMM-Phish.js` renders the countdown and setlist, updating the DOM every second for the live timer
- `MMM-Phish.css` provides the retro CRT aesthetic with VT323, Share Tech Mono, and Press Start 2P fonts (loaded from Google Fonts)
