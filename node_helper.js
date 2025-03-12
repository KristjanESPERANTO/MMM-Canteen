const NodeHelper = require("node_helper");
const Log = require("logger");
const {Temporal} = require("temporal-polyfill");

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

    const now = Temporal.Now.plainDateTimeISO();
    const [switchTimeHour, switchTimeMinute] = this.config.switchTime.split(":");
    const switchTime = now.with({hour: switchTimeHour, minute: switchTimeMinute});
    const isBeforeSwitchTime = Temporal.PlainTime.compare(now, switchTime) < 0;

    if (isBeforeSwitchTime) {
      data.date = Temporal.PlainDate.from(now);
    } else {
      data.date = Temporal.PlainDate.from(now).add({days: 1});
    }

    data.identifier = identifier;

    while (extraDays < 7 && !done) {
      const requestURL = `https://openmensa.org/api/v2/canteens/${this.config.canteen}/days/${data.date}/meals`;
      Log.debug(`[MMM-Canteen] requestURL: ${requestURL}`);
      const self = this;

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(`[MMM-Canteen] Mensa closed on ${data.date} trying next day…`);
          data.extraDays = extraDays;
          self.sendSocketNotification("CLOSED", data);
          data.date = Temporal.PlainDate.from(data.date).add({days: 1});
          extraDays += 1;
        } else {
          Log.info(`[MMM-Canteen] Received menu for ${data.date}.`);
          data.meals = await response.json();
          Log.debug("MEALS", data);
          self.sendSocketNotification("MEALS", data);
          done = true;
        }
      } catch (error) {
        Log.error(`[MMM-Canteen] ${error}`);
      }
    }
  }
});
