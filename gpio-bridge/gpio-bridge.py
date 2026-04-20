#!/usr/bin/env python3
"""
TinkerPi GPIO Bridge

Owns all GPIO via gpiozero. Exposes state via HTTP API on port 5000.
MagicMirror's MMM-TinkerPiHardware module talks to this bridge.

Hardware (prototype — one of each):
  - LED on GPIO 17: controlled by MagicMirror (on/off/blink)
  - Toggle switch on GPIO 27: sends state changes to MagicMirror
  - Rotary encoder on GPIO 22/23: adjusts screen brightness (0-31)

Backlight: /sys/class/backlight/11-0045/brightness (range 0-31)
"""

import json
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from gpiozero import LED, Button, RotaryEncoder

# --- Configuration ---
HTTP_PORT = 5000
LED_PIN = 17
SWITCH_PIN = 27
ENCODER_PIN_A = 22
ENCODER_PIN_B = 23
BACKLIGHT_PATH = "/sys/class/backlight/11-0045/brightness"
BACKLIGHT_MAX = 31

# --- GPIO Setup ---
led = LED(LED_PIN)
switch = Button(SWITCH_PIN, pull_up=True, bounce_time=0.05)
encoder = RotaryEncoder(ENCODER_PIN_A, ENCODER_PIN_B, max_steps=BACKLIGHT_MAX, wrap=False)

# Initialize encoder to current brightness
try:
    with open(BACKLIGHT_PATH, "r") as f:
        current = int(f.read().strip())
    encoder.steps = current
except Exception:
    encoder.steps = BACKLIGHT_MAX

# --- State ---
state = {
    "led": "off",
    "switch": False,
    "brightness": encoder.steps,
}
state_lock = threading.Lock()
# Track state changes for polling
change_events = []
change_lock = threading.Lock()


def record_change(source, value):
    with change_lock:
        change_events.append({"source": source, "value": value, "t": time.time()})
        # Keep only last 50 events
        if len(change_events) > 50:
            change_events.pop(0)


# --- GPIO Callbacks ---
def on_switch_pressed():
    with state_lock:
        state["switch"] = True
    record_change("switch", True)


def on_switch_released():
    with state_lock:
        state["switch"] = False
    record_change("switch", False)


def on_encoder_rotated():
    steps = encoder.steps
    # Clamp to 0-max
    if steps < 0:
        encoder.steps = 0
        steps = 0
    brightness = steps
    with state_lock:
        state["brightness"] = brightness
    # Write to backlight
    try:
        with open(BACKLIGHT_PATH, "w") as f:
            f.write(str(brightness))
    except Exception as e:
        print(f"Backlight write error: {e}")
    record_change("encoder", brightness)


switch.when_pressed = on_switch_pressed
switch.when_released = on_switch_released
encoder.when_rotated = on_encoder_rotated


# --- LED Control ---
def set_led(mode):
    with state_lock:
        state["led"] = mode
    if mode == "on":
        led.on()
    elif mode == "off":
        led.off()
    elif mode == "blink":
        led.blink(on_time=0.5, off_time=0.5)
    else:
        led.off()
        with state_lock:
            state["led"] = "off"


# --- HTTP API ---
class BridgeHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        return json.loads(body) if body else {}

    def do_GET(self):
        if self.path == "/status":
            with state_lock:
                self._send_json(dict(state))
        elif self.path == "/events":
            # Return recent change events since timestamp (query param ?since=)
            since = 0
            if "?" in self.path:
                params = dict(p.split("=") for p in self.path.split("?")[1].split("&") if "=" in p)
                since = float(params.get("since", 0))
            with change_lock:
                recent = [e for e in change_events if e["t"] > since]
            self._send_json({"events": recent, "now": time.time()})
        else:
            self._send_json({"error": "not found"}, 404)

    def do_POST(self):
        if self.path == "/led":
            data = self._read_json()
            mode = data.get("state", "off")
            set_led(mode)
            with state_lock:
                self._send_json({"ok": True, "led": state["led"]})
        elif self.path == "/brightness":
            data = self._read_json()
            value = max(0, min(BACKLIGHT_MAX, int(data.get("value", 0))))
            encoder.steps = value
            with state_lock:
                state["brightness"] = value
            try:
                with open(BACKLIGHT_PATH, "w") as f:
                    f.write(str(value))
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
                return
            self._send_json({"ok": True, "brightness": value})
        else:
            self._send_json({"error": "not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        # Log to stdout (captured by journalctl)
        print(f"[bridge] {args[0]}")


# --- Main ---
if __name__ == "__main__":
    print(f"TinkerPi GPIO Bridge starting on port {HTTP_PORT}")
    print(f"  LED: GPIO {LED_PIN}")
    print(f"  Switch: GPIO {SWITCH_PIN}")
    print(f"  Encoder: GPIO {ENCODER_PIN_A}/{ENCODER_PIN_B}")
    print(f"  Backlight: {BACKLIGHT_PATH} (max: {BACKLIGHT_MAX})")

    server = HTTPServer(("127.0.0.1", HTTP_PORT), BridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        led.off()
        led.close()
        switch.close()
        encoder.close()
        server.server_close()
