# MMM-Goose

A MagicMirror² module that shows a countdown to the next Goose show and the most recent setlist.

## Features

- **Countdown timer** to the next upcoming show (days, hours, minutes, seconds)
- **Tonight mode** — gold-themed countdown when the show is today
- **Live mode** — pulsing red indicator when the show has started
- **Last setlist** — most recent show's setlist grouped by set (S1, S2, E)
- **Tour name** display when available
- Retro CRT terminal aesthetic (blue/teal text, glowing effects, monospace fonts)

## Installation

1. Copy this folder into your MagicMirror modules directory:

```bash
cp -r MMM-Goose ~/MagicMirror/modules/
```

2. No npm dependencies required.

3. No API key needed — the [elgoose.net](https://elgoose.net) API is public.

4. Add this to your `~/MagicMirror/config/config.js` in the `modules` array:

```javascript
{
    module: "MMM-Goose",
    position: "fullscreen_above",
    config: {
        updateInterval: 15 * 60 * 1000, // 15 minutes
    },
},
```

5. Restart MagicMirror.

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `updateInterval` | `900000` (15 min) | How often to fetch new data from the API (ms) |

## Position

Works in any MagicMirror position. Looks best in `fullscreen_above` on a small display, or in a region like `top_right` / `bottom_left` on larger screens.

## API

Uses the [elgoose.net v2 API](https://elgoose.net):

- Latest setlist — most recent show's track listing
- Shows by artist — finds upcoming Goose shows

No API key required. No rate limit concerns at 15-minute intervals.

## How it works

- `node_helper.js` fetches from elgoose.net every 15 minutes
- `MMM-Goose.js` renders countdown and setlist, ticking every second
- `MMM-Goose.css` provides the blue/teal CRT aesthetic with VT323, Share Tech Mono, and Press Start 2P fonts
