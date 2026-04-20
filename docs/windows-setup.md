# Setting Up MagicMirror on Windows

This guide gets MagicMirror² running on your Windows machine so you can develop and test modules locally before deploying to the Pi.

## 1. Install Node.js

MagicMirror 2.35.0 requires **Node.js 22 or 24**.

1. Go to [nodejs.org](https://nodejs.org)
2. Download the **v22 LTS** installer (Windows .msi)
3. Run the installer — accept all defaults
4. Verify it worked:

```powershell
node --version
# Should show v22.x.x
npm --version
```

## 2. Install Git

1. Go to [git-scm.com](https://git-scm.com/download/win)
2. Download and run the installer — defaults are fine
3. Verify:

```powershell
git --version
```

## 3. Clone MagicMirror

Open PowerShell or Terminal and run:

```powershell
cd ~
git clone https://github.com/MagicMirrorOrg/MagicMirror.git
cd MagicMirror
npm install
```

This takes a few minutes. It installs Electron and all dependencies.

## 4. Create your config

```powershell
cp config/config.js.sample config/config.js
```

Open `config/config.js` in your editor and replace the contents with a basic setup:

```javascript
let config = {
    address: "localhost",
    port: 8080,
    basePath: "/",
    ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],
    language: "en",
    locale: "en-US",
    timeFormat: 12,
    units: "imperial",
    electronOptions: {
        width: 1280,
        height: 720,
        fullscreen: false,
        frame: true,
    },

    modules: [
        // Add modules here — see each module's README for the config snippet
    ],
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
```

Note: we set `fullscreen: false` and `frame: true` for local development so you can see it in a normal window. On the Pi it runs fullscreen.

## 5. Install a module

Example with MMM-Goose (no API key needed — good for testing):

```powershell
# From wherever you cloned tinkerpi-modules:
cp -r modules/MMM-Goose ~/MagicMirror/modules/
```

Then add the module to your `config/config.js` in the `modules` array:

```javascript
modules: [
    {
        module: "MMM-Goose",
        position: "fullscreen_above",
        config: {
            updateInterval: 15 * 60 * 1000,
        },
    },
],
```

## 6. Run MagicMirror

```powershell
cd ~/MagicMirror
npm run start:windows
```

An Electron window should open showing your dashboard. That's it — you're running locally.

To stop it, close the window or press `Ctrl+C` in the terminal.

## 7. Dev mode (auto-reload on CSS changes)

```powershell
npm run start:windows:dev
```

This opens with DevTools so you can inspect elements and see console logs.

## Tips

- **Config errors?** Run `npm run config:check` to validate your config.js
- **Module not showing?** Check the DevTools console (F12) for errors
- **Blank screen?** Usually a config.js syntax error — check for missing commas
- **Multiple modules?** Just add more entries to the `modules` array, separated by commas
