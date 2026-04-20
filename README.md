# TinkerPi Modules

Custom [MagicMirror²](https://magicmirror.builders/) modules and utilities for a Raspberry Pi dashboard.

Built for a Pi 5 with a 5" touchscreen, but should work on any MagicMirror setup.

## What's here

Each folder is a standalone piece you can grab independently:

| Module | What it does |
|--------|-------------|
| [MMM-Phish](modules/MMM-Phish/) | Phish concert countdown, setlists, and "on this day" history |
| [MMM-Goose](modules/MMM-Goose/) | Goose concert countdown and setlists |

More modules coming (navigation, GPIO hardware controls, etc).

## Prerequisites

- Raspberry Pi (any model) running [MagicMirror²](https://docs.magicmirror.builders/getting-started/installation.html)
- Node.js >= 20

## Installing a module

Each module has its own README with specific instructions, but the general pattern is:

```bash
# 1. Copy the module folder into your MagicMirror modules directory
cp -r modules/MMM-Name ~/MagicMirror/modules/

# 2. Install dependencies (if the module has a package.json)
cd ~/MagicMirror/modules/MMM-Name && npm install

# 3. Add the config entry to ~/MagicMirror/config/config.js
#    (see the module's README for the exact snippet)

# 4. Restart MagicMirror
pm2 restart MagicMirror
# or if using systemd:
systemctl --user restart magicmirror
```

## MagicMirror module basics

Every module is a folder with up to three files:

```
MMM-Name/
├── MMM-Name.js       # Frontend — what renders on screen
├── node_helper.js    # Backend — API calls, data fetching
└── MMM-Name.css      # Styling
```

The frontend and backend communicate via socket notifications. The frontend calls `sendSocketNotification()` to request data, and the backend calls `sendSocketNotification()` to send it back.

## License

MIT
