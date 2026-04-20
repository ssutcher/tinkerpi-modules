# GPIO Bridge

A Python service that owns GPIO pins on the Raspberry Pi 5 and exposes their state via a local HTTP API. Designed to pair with [MMM-TinkerPiHardware](../modules/MMM-TinkerPiHardware/) but can be used standalone.

## Status

**Work in progress.** Software is deployed and running. Hardware wiring test pending.

## What it does

- Reads a **toggle switch** and **rotary encoder** via [gpiozero](https://gpiozero.readthedocs.io/)
- Drives an **LED** (on/off/blink)
- Controls **screen brightness** via the Pi's backlight sysfs interface
- Exposes everything on `http://127.0.0.1:5000`

## Requirements

- Raspberry Pi 5 (uses lgpio backend via gpiozero — Pi 4 should also work)
- Python 3 with gpiozero 2.0+ (pre-installed on Raspberry Pi OS Bookworm)
- User must be in `gpio` and `video` groups

## GPIO Pins

| Component | GPIO | Physical Pin | gpiozero Class |
|-----------|------|-------------|----------------|
| LED | 17 | Pin 11 | `LED(17)` |
| Toggle switch | 27 | Pin 13 | `Button(27, pull_up=True)` |
| Rotary encoder A | 22 | Pin 15 | `RotaryEncoder(22, 23)` |
| Rotary encoder B | 23 | Pin 16 | (same object) |

All ground connections go to any GND pin (e.g., pins 9, 14, 20).

## Wiring

```
LED:      Anode → 220-330Ω resistor → GPIO 17 (pin 11)
          Cathode → GND (pin 9)

Switch:   One terminal → GPIO 27 (pin 13)
          Other terminal → GND (pin 14)
          (internal pull-up enabled — no external resistor needed)

Encoder:  A → GPIO 22 (pin 15)
          B → GPIO 23 (pin 16)
          C (common) → GND (pin 20)
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Returns `{led, switch, brightness}` |
| `/events?since=TIMESTAMP` | GET | Recent state change events |
| `/led` | POST | Set LED: `{state: "on"/"off"/"blink"}` |
| `/brightness` | POST | Set brightness: `{value: 0-31}` |

## Install

```bash
# Copy to Pi
scp -r gpio-bridge/ tinkerpi:~/gpio-bridge/

# Install systemd service
ssh tinkerpi "sudo cp ~/gpio-bridge/tinkerpi-gpio.service /etc/systemd/system/"
ssh tinkerpi "sudo systemctl daemon-reload"
ssh tinkerpi "sudo systemctl enable tinkerpi-gpio"
ssh tinkerpi "sudo systemctl start tinkerpi-gpio"

# Check status
ssh tinkerpi "systemctl status tinkerpi-gpio"
ssh tinkerpi "curl -s http://127.0.0.1:5000/status"
```

## Backlight

The Pi 5 with CanaKit Touch Display 2 uses `/sys/class/backlight/11-0045/brightness` with a range of **0-31** (not 0-255). This may differ on other displays — check `ls /sys/class/backlight/` and `cat /sys/class/backlight/*/max_brightness` on your Pi.

## Pi 5 Notes

- gpiozero 2.0+ auto-selects the `lgpio` backend on Pi 5. `RPi.GPIO` does **not** work on Pi 5.
- `/dev/gpiochip4` is a symlink to `/dev/gpiochip0` on kernel 6.6.45+.
- The systemd service must use `PrivateDevices=no` or GPIO devices will be hidden.

## License

MIT
