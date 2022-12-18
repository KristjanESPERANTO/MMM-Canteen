/* eslint-disable no-await-in-loop */
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
      }, 10 * 60 * 1000);
    }
  },

  async collectData() {
    let extraDays = 0;
    let done = false;
    const data = {};

    if (moment() < moment(this.config.switchTime, "HH:mm")) {
      data.date = moment().format("YYYY-MM-DD");
    } else {
      data.date = moment().add(1, "days").format("YYYY-MM-DD");
    }

    while (extraDays < 7 && !done) {
      const requestURL = `https://openmensa.org/api/v2/canteens/${this.config.canteen}/days/${data.date}/meals`;
      // Log.log(requestURL);
      const self = this;

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(
            `[MMM-Canteen] Mensa closed on ${data.date} trying next day…`
          );
          data.extraDays = extraDays;
          self.sendSocketNotification("CLOSED", data);
          data.date = moment(data.date, "YYYY-MM-DD")
            .add(1, "days")
            .format("YYYY-MM-DD");
          extraDays += 1;
        } else {
          Log.info(`[MMM-Canteen] Received menu for ${data.date}.`);
          data.meals = await response.json();
          // Log.log(data);
          self.sendSocketNotification("MEALS", data);
          done = true;
        }
      } catch (error) {
        Log.error(`[MMM-Canteen] ${error}`);
      }
    }
  }
});
