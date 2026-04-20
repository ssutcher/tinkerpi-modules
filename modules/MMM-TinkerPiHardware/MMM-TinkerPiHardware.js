/**
 * MMM-TinkerPiHardware
 *
 * Bridges physical GPIO controls to MagicMirror via the gpio-bridge service.
 * Sends broadcast notifications when switches/encoders change.
 * Listens for notifications from other modules to control LEDs.
 *
 * Prototype controls:
 *   Switch → toggles a module visible/hidden
 *   Encoder → adjusts screen brightness
 *   LED → lights when MagicMirror is loaded
 */

Module.register("MMM-TinkerPiHardware", {
  defaults: {
    bridgeUrl: "http://127.0.0.1:5000",
    pollInterval: 200,
    // Module name to toggle with the switch (prototype)
    toggleModule: "MMM-Phish",
  },

  start: function () {
    Log.info(`[${this.name}] Starting...`);
    this.bridgeConnected = false;
    this.switchState = false;

    // Tell node_helper to connect to the bridge
    this.sendSocketNotification("BRIDGE_INIT", {
      bridgeUrl: this.config.bridgeUrl,
      pollInterval: this.config.pollInterval,
    });
  },

  // No visible DOM — this module is invisible
  getDom: function () {
    return document.createElement("div");
  },

  // Receive state changes from node_helper (bridge)
  socketNotificationReceived: function (notification, payload) {
    if (notification === "BRIDGE_STATUS") {
      // Initial full state from bridge
      this.bridgeConnected = true;
      this.switchState = payload.switch;
      Log.info(
        `[${this.name}] Bridge connected. State: switch=${payload.switch}, brightness=${payload.brightness}, led=${payload.led}`
      );
    }

    if (notification === "SWITCH_CHANGED") {
      this.switchState = payload.state;
      Log.info(`[${this.name}] Switch: ${payload.state}`);

      // Broadcast to all modules
      this.sendNotification("TINKERPI_SWITCH", { state: payload.state });

      // Prototype: toggle a module visible/hidden
      this.toggleTargetModule(payload.state);
    }

    if (notification === "BRIGHTNESS_CHANGED") {
      Log.info(`[${this.name}] Brightness: ${payload.brightness}`);
      this.sendNotification("TINKERPI_BRIGHTNESS", {
        brightness: payload.brightness,
      });
    }
  },

  // Listen for notifications from other modules
  notificationReceived: function (notification, payload, sender) {
    // Other modules can control the LED
    if (notification === "TINKERPI_LED_SET") {
      this.sendSocketNotification("LED_CONTROL", {
        state: payload.state,
      });
    }

    // Other modules can set brightness
    if (notification === "TINKERPI_BRIGHTNESS_SET") {
      this.sendSocketNotification("SET_BRIGHTNESS", {
        value: payload.value,
      });
    }
  },

  // Prototype: toggle target module visibility
  toggleTargetModule: function (switchOn) {
    const modules = MM.getModules().filter(
      (m) => m.name === this.config.toggleModule
    );

    modules.forEach((mod) => {
      if (switchOn) {
        mod.hide(300);
      } else {
        mod.show(300);
      }
    });
  },
});
