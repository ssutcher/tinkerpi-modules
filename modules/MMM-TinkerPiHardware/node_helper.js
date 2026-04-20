/**
 * MMM-TinkerPiHardware — Node Helper
 *
 * Polls the GPIO bridge HTTP API and relays state changes
 * as MagicMirror socket notifications. Also receives commands
 * from the frontend to control LEDs.
 */

const NodeHelper = require("node_helper");
const http = require("http");

module.exports = NodeHelper.create({
  bridgeUrl: "http://127.0.0.1:5000",
  pollInterval: 200,
  lastState: null,
  pollTimer: null,

  start: function () {
    console.log(`[${this.name}] Node helper started`);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "BRIDGE_INIT") {
      this.bridgeUrl = payload.bridgeUrl || this.bridgeUrl;
      this.pollInterval = payload.pollInterval || this.pollInterval;
      console.log(
        `[${this.name}] Connecting to bridge at ${this.bridgeUrl} (poll: ${this.pollInterval}ms)`
      );
      this.startPolling();
      // Turn LED on to signal MagicMirror is loaded
      this.postBridge("/led", { state: "on" });
    }

    if (notification === "LED_CONTROL") {
      this.postBridge("/led", { state: payload.state });
    }

    if (notification === "SET_BRIGHTNESS") {
      this.postBridge("/brightness", { value: payload.value });
    }
  },

  startPolling: function () {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.fetchStatus();
    }, this.pollInterval);
    // Initial fetch
    this.fetchStatus();
  },

  fetchStatus: function () {
    this.getBridge("/status", (err, data) => {
      if (err) {
        // Bridge not reachable — don't spam logs
        return;
      }

      const prev = this.lastState;
      this.lastState = data;

      if (!prev) {
        // First fetch — send full state
        this.sendSocketNotification("BRIDGE_STATUS", data);
        return;
      }

      // Detect changes and send specific notifications
      if (prev.switch !== data.switch) {
        this.sendSocketNotification("SWITCH_CHANGED", {
          state: data.switch,
        });
      }

      if (prev.brightness !== data.brightness) {
        this.sendSocketNotification("BRIGHTNESS_CHANGED", {
          brightness: data.brightness,
        });
      }

      if (prev.led !== data.led) {
        this.sendSocketNotification("LED_CHANGED", {
          led: data.led,
        });
      }
    });
  },

  getBridge: function (path, callback) {
    const url = this.bridgeUrl + path;
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            callback(null, JSON.parse(body));
          } catch (e) {
            callback(e);
          }
        });
      })
      .on("error", (e) => callback(e));
  },

  postBridge: function (path, data) {
    const url = new URL(this.bridgeUrl + path);
    const body = JSON.stringify(data);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => {
        try {
          const result = JSON.parse(responseBody);
          console.log(`[${this.name}] POST ${path}: ${JSON.stringify(result)}`);
        } catch (e) {
          // ignore parse errors on responses
        }
      });
    });

    req.on("error", (e) => {
      console.log(`[${this.name}] Bridge POST error: ${e.message}`);
    });

    req.write(body);
    req.end();
  },

  stop: function () {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    // Turn LED off on shutdown
    this.postBridge("/led", { state: "off" });
    console.log(`[${this.name}] Node helper stopped`);
  },
});
