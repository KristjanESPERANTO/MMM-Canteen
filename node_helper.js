const NodeHelper = require("node_helper");
const dayjs = require("dayjs");
const Log = require("logger");

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting module helper: ${this.name}`);
  },

  socketNotificationReceived (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload.config;
      this.collectData(payload.identifier);
      const self = this;
      setInterval(
        () => {
          self.collectData(payload.identifier);
        },
        this.config.updateInterval
      );
    }
  },

  async collectData (identifier) {
    let done = false;
    let extraDays = 0;
    const data = {};

    if (dayjs() < dayjs(this.config.switchTime, "HH:mm")) {
      data.date = dayjs().format("YYYY-MM-DD");
    } else {
      data.date = dayjs().add(1, "days")
        .format("YYYY-MM-DD");
    }

    data.identifier = identifier;

    while (extraDays < 7 && !done) {
      const requestURL = `https://openmensa.org/api/v2/canteens/${this.config.canteen}/days/${data.date}/meals`;
      // Log.log(`[MMM-Canteen] ${requestURL}`);
      const self = this;

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(`[MMM-Canteen] Mensa closed on ${data.date} trying next day…`);
          data.extraDays = extraDays;
          self.sendSocketNotification("CLOSED", data);
          data.date = dayjs(data.date, "YYYY-MM-DD")
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
