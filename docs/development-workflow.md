# Development Workflow

How to build modules locally, test them on your machine, and deploy to the Pi.

## The loop

```
Edit module code → Test locally → Happy? → Deploy to Pi
      ↑                                         |
      └─────────── not right yet ←───────────────┘
```

Everything happens on your PC. The Pi is just the final target — you never need to edit code on it directly.

## Project layout

Keep this repo (tinkerpi-modules) cloned somewhere on your machine. Your local MagicMirror installation is separate:

```
~/tinkerpi-modules/          ← this repo (your module source code)
    modules/
        MMM-Phish/
        MMM-Goose/

~/MagicMirror/               ← your local MagicMirror install (for testing)
    modules/
        MMM-Phish/           ← copied from tinkerpi-modules
        MMM-Goose/
    config/config.js
```

You edit in `tinkerpi-modules/`, copy to `MagicMirror/modules/` to test.

## Step by step

### 1. Edit your module

Make changes to files in `tinkerpi-modules/modules/MMM-Name/`.

If you're using Claude Code, you can ask it to help you build or modify modules. It understands the MagicMirror module structure (see the main README for the pattern).

### 2. Copy to local MagicMirror

After editing, copy the updated module into your MagicMirror install:

**Windows (PowerShell):**
```powershell
cp -r ~/tinkerpi-modules/modules/MMM-Name ~/MagicMirror/modules/ -Force
```

**Mac/Linux:**
```bash
cp -r ~/tinkerpi-modules/modules/MMM-Name ~/MagicMirror/modules/
```

### 3. Test locally

```powershell
# Windows
cd ~/MagicMirror
npm run start:windows

# Mac/Linux
cd ~/MagicMirror
npm start
```

Check that your module looks right. Use DevTools (F12 or `npm run start:windows:dev`) to debug.

### 4. Iterate

Close MagicMirror, make changes in `tinkerpi-modules/`, copy again, re-launch. Repeat until it's working how you want.

For CSS-only changes, dev mode auto-reloads so you don't need to restart.

### 5. Deploy to the Pi

Once you're happy with how it looks locally, push it to the Pi.

**First, make sure you can SSH to your Pi.** From your terminal:

```bash
ssh pi@<your-pi-ip>
# or if you've set up a hostname:
ssh pi@raspberrypi.local
```

**Copy the module:**
```bash
scp -r ~/tinkerpi-modules/modules/MMM-Name pi@<your-pi-ip>:~/MagicMirror/modules/
```

**If it's a brand new module**, you also need to add it to the Pi's `config/config.js`:
```bash
ssh pi@<your-pi-ip>
nano ~/MagicMirror/config/config.js
# Add the module config entry, save, exit
```

**Restart MagicMirror on the Pi:**
```bash
ssh pi@<your-pi-ip> "pm2 restart MagicMirror"
# or if using systemd:
ssh pi@<your-pi-ip> "systemctl --user restart magicmirror"
```

### 6. Commit your changes

After deploying, commit your work to this repo so you don't lose it:

```bash
cd ~/tinkerpi-modules
git add -A
git commit -m "describe what you changed"
git push
```

## Using Claude Code for development

Claude Code is great for this workflow. Here are some things you can ask it:

**Building a new module:**
> "Create a new MagicMirror module called MMM-Weather that shows the current temperature and forecast. Use the OpenWeatherMap API."

**Modifying an existing module:**
> "Change the countdown font size in MMM-Phish to be bigger"
> "Add a new 'on tour' indicator to MMM-Goose"

**Debugging:**
> "I'm getting this error in the console: [paste error]. What's wrong?"

**Deploying:**
> "Copy MMM-Phish to my MagicMirror modules folder and start it"

Claude can read and edit the module files directly, copy them to your MagicMirror install, and even run MagicMirror for you.

## Creating a new module from scratch

Every module follows the same three-file pattern:

```
modules/MMM-Name/
├── MMM-Name.js       # Frontend — renders the UI
├── node_helper.js    # Backend — fetches data from APIs
└── MMM-Name.css      # Styling
```

The frontend and backend talk via socket notifications:
- Frontend calls `this.sendSocketNotification("FETCH_DATA", config)` to request data
- Backend calls `this.sendSocketNotification("DATA_RESULT", data)` to send it back
- Frontend calls `this.updateDom()` to re-render when new data arrives

Look at MMM-Goose as a clean example — it's the simplest module in the collection.

## Tips

- **Always test locally first.** Debugging on the Pi over SSH is painful.
- **Use dev mode** (`npm run start:windows:dev`) for CSS tweaks — it auto-reloads.
- **Check the console.** Both frontend (DevTools F12) and backend (the terminal running MagicMirror) print logs.
- **API issues?** The backend `node_helper.js` logs errors to the terminal, not the browser console.
- **Config.js on Pi vs local:** They can be different. Your local one might have `fullscreen: false` for windowed testing while the Pi runs fullscreen. The `modules` array should match though.
