# MMM-TinkerPiHardware

An invisible MagicMirror² module that bridges physical GPIO controls to the MagicMirror notification system. Pairs with the [GPIO Bridge](../../gpio-bridge/) service.

## Status

**Work in progress.** Software is deployed and running. Hardware wiring test pending.

## How it works

```
Physical hardware → gpio-bridge.py (Python, port 5000) → MMM-TinkerPiHardware (polls HTTP) → MagicMirror notifications
```

The module has no visible UI. It runs in the background, polling the GPIO bridge every 200ms for state changes, and broadcasts MagicMirror notifications that other modules can listen for.

## Install

1. Set up the [GPIO Bridge](../../gpio-bridge/) first
2. Copy this module to your MagicMirror modules directory:
   ```bash
   cp -r modules/MMM-TinkerPiHardware ~/MagicMirror/modules/
   ```
3. Add to `config.js`:
   ```javascript
   {
       module: "MMM-TinkerPiHardware",
       config: {
           bridgeUrl: "http://127.0.0.1:5000",
           pollInterval: 200,
           toggleModule: "MMM-Phish",  // module to toggle with the switch
       },
   },
   ```
   No `position` needed — this module is invisible.
4. Restart MagicMirror

## Config Options

| Option | Default | Description |
|--------|---------|-------------|
| `bridgeUrl` | `"http://127.0.0.1:5000"` | GPIO bridge HTTP API URL |
| `pollInterval` | `200` | How often to poll the bridge (ms) |
| `toggleModule` | `"MMM-Phish"` | Which module the switch toggles visible/hidden |

## Notifications Sent

Other modules can listen for these in their `notificationReceived`:

| Notification | Payload | When |
|-------------|---------|------|
| `TINKERPI_SWITCH` | `{state: true/false}` | Toggle switch flipped |
| `TINKERPI_BRIGHTNESS` | `{brightness: 0-31}` | Rotary encoder turned |

## Notifications Received

Other modules can send these to control hardware:

| Notification | Payload | Effect |
|-------------|---------|--------|
| `TINKERPI_LED_SET` | `{state: "on"/"off"/"blink"}` | Controls the LED |
| `TINKERPI_BRIGHTNESS_SET` | `{value: 0-31}` | Sets screen brightness |

## Example: React to switch in your module

```javascript
notificationReceived: function(notification, payload, sender) {
    if (notification === "TINKERPI_SWITCH") {
        if (payload.state) {
            // Switch is ON
            this.doSomething();
        } else {
            // Switch is OFF
            this.doSomethingElse();
        }
    }
}
```

## Example: Light the LED from your module

```javascript
// Turn LED on
this.sendNotification("TINKERPI_LED_SET", { state: "on" });

// Blink
this.sendNotification("TINKERPI_LED_SET", { state: "blink" });
```

## License

MIT
