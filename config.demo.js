/**
 * Demo configuration for MMM-Canteen module development
 * This config is used for testing the module in isolation
 *
 * Usage: node --run demo
 */

let config = {
  port: 8080,
  address: "localhost",
  language: "de",
  logLevel: ["INFO", "LOG", "WARN", "ERROR"],
  timeFormat: 24,
  units: "metric",

  modules: [
    {
      module: "clock",
      position: "middle_center",
      config: {
        timeFormat: "HH:mm:ss"
      }
    },
    {
      module: "MMM-Canteen",
      position: "top_left",
      config: {
        canteenName: "Leipzig, Mensa am Park",
        canteen: 63,
        status: "employees",
        switchTime: "15:00",
        showVeggieColumn: false,
        blacklistKeywords: []
      }
    },
    {
      module: "MMM-Canteen",
      position: "top_right",
      config: {
        canteenName: "Weinbergmensa",
        canteen: 240
      }
    },
    {
      module: "MMM-Canteen",
      position: "bottom_left",
      config: {
        canteenName: "Mensa Bernburg",
        canteen: 241
      }
    },
    {
      module: "MMM-Canteen",
      position: "bottom_right",
      config: {
        canteenName: "Harzmensa",
        canteen: 243
      }
    }
  ]
};

/** ************* DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = config;
}
