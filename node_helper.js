const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting module helper: ${this.name}`);
  },

  socketNotificationReceived (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload.config;
      this.collectData(payload.identifier);
      const that = this;
      setInterval(
        () => {
          that.collectData(payload.identifier);
        },
        this.config.updateInterval
      );
    }
  },

  async collectData (identifier) {
    let done = false;
    let extraDays = 0;
    const data = {};

    const date = new Date();
    const [switchTimeHour, switchTimeMinute] = this.config.switchTime.split(":");
    const switchTime = new Date().setHours(switchTimeHour, switchTimeMinute, 0, 0);
    const isAfterSwitchTime = date > switchTime;

    if (isAfterSwitchTime) {
      date.setDate(date.getDate() + 1);
    }
    data.date = new Date(date)
      .toISOString()
      .slice(0, 10);

    data.identifier = identifier;

    while (extraDays < 7 && !done) {
      const requestURL = `https://openmensa.org/api/v2/canteens/${this.config.canteen}/days/${data.date}/meals`;
      Log.debug(`[MMM-Canteen] requestURL: ${requestURL}`);
      const that = this;

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(`[MMM-Canteen] Mensa closed on ${data.date} trying next day…`);
          data.extraDays = extraDays;
          that.sendSocketNotification("CLOSED", data);
          date.setDate(date.getDate() + 1);
          data.date = new Date(date)
            .toISOString()
            .slice(0, 10);
          extraDays += 1;
        } else {
          Log.info(`[MMM-Canteen] Received menu for ${data.date}.`);
          data.meals = await response.json();
          Log.debug("MEALS", data);
          that.sendSocketNotification("MEALS", data);
          done = true;
        }
      } catch (error) {
        Log.error(`[MMM-Canteen] ${error}`);
      }
    }
  }
});
