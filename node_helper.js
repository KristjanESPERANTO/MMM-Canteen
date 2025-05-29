const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting module helper: ${this.name}`);
  },

  async socketNotificationReceived(notification, payload) {
    if (notification.includes("CANTEEN_REQUEST")) {
      const identifier = notification.substring(
        "CANTEEN_REQUEST".length + 1,
      );

      this.collectData(identifier, payload);
    }
  },

  async collectData(identifier, payload) {
    let done = false;
    let extraDays = 0;
    const data = {};

    const date = new Date();
    const [switchTimeHour, switchTimeMinute] = payload.switchTime.split(":");
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
      const requestURL = `https://openmensa.org/api/v2/canteens/${payload.canteen}/days/${data.date}/meals`;
      Log.debug(`[MMM-Canteen] [${identifier}] requestURL: ${requestURL}`);

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(`[MMM-Canteen] [${identifier}] Mensa closed on ${data.date} trying next day…`);
          data.extraDays = extraDays;
          this.sendSocketNotification(
            `CANTEEN_RESPONSE-CLOSED-${identifier}`,
            data,
          );
          date.setDate(date.getDate() + 1);
          data.date = new Date(date)
            .toISOString()
            .slice(0, 10);
          extraDays += 1;
        } else {
          Log.info(`[MMM-Canteen] [${identifier}] Received menu for ${data.date}.`);
          data.meals = await response.json();
          Log.debug("MEALS [${identifier}]", data);
          this.sendSocketNotification(
            `CANTEEN_RESPONSE-MEALS-${identifier}`,
            data,
          );
          done = true;
        }
      } catch (error) {
        Log.error(`[MMM-Canteen] [${identifier}] ${error}`);
      }
    }
  }
});
