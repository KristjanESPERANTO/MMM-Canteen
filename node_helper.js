const NodeHelper = require("node_helper");
const moment = require("moment");
const Log = require("logger");

const fetch = (...args) =>
  // eslint-disable-next-line no-shadow
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = NodeHelper.create({
  start() {
    Log.log(`Starting module helper: ${this.name}`);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      this.collectData();
      const self = this;
      setInterval(() => {
        self.collectData();
      }, 60 * 1000);
    }
  },

  async collectData() {
    let today;
    if (moment() < moment(this.config.switchTime, "HH:mm")) {
      today = moment().format("YYYY-MM-DD");
    } else {
      today = moment().add(1, "days").format("YYYY-MM-DD");
    }
    const requestURL = `https://openmensa.org/api/v2/canteens/${this.config.canteen}/days/${today}/meals`;
    // Log.log(requestURL);
    const self = this;

    try {
      const response = await fetch(requestURL);

      if (response.status === 404) {
        Log.info("Kantine hat heut dicht!");
        self.sendSocketNotification("CLOSED", null);
      } else {
        const data = await response.json();
        // Log.log(data);
        self.sendSocketNotification("MEALS", data);
      }
    } catch (error) {
      Log.error(error);
    }
  }
});
