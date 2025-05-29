const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start() {
    Log.log(`Starting module helper: ${this.name}`);
  },

  async socketNotificationReceived(notification, payload) {
    if (!notification.startsWith("CANTEEN_REQUEST")) return;

    const identifier = notification.substring("CANTEEN_REQUEST".length + 1);
    await this.collectData(identifier, payload);
  },

  async collectData(identifier, payload) {
    const maxAttempts = 7;
    const data = {identifier};
    let extraDays = 0;
    let done = false;

    let date = this.getAdjustedStartDate(payload.switchTime);
    data.date = this.formatDate(date);

    while (extraDays < maxAttempts && !done) {
      const requestURL = `https://openmensa.org/api/v2/canteens/${payload.canteen}/days/${data.date}/meals`;
      Log.debug(`[MMM-Canteen] [${identifier}] requestURL: ${requestURL}`);

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(`[MMM-Canteen] [${identifier}] Mensa closed on ${data.date}, trying next day…`);
          data.extraDays = extraDays;
          this.sendSocketNotification(`CANTEEN_RESPONSE-CLOSED-${identifier}`, data);

          date.setDate(date.getDate() + 1);
          data.date = this.formatDate(date);
          extraDays++;
          continue;
        }

        const meals = await response.json();
        Log.info(`[MMM-Canteen] [${identifier}] Received menu for ${data.date}.`);
        Log.debug(`[MMM-Canteen] [${identifier}] Meals:`, meals);

        data.meals = meals;
        this.sendSocketNotification(`CANTEEN_RESPONSE-MEALS-${identifier}`, data);
        done = true;

      } catch (error) {
        Log.error(`[MMM-Canteen] [${identifier}] Error fetching meals: ${error}`);
        break;
      }
    }
  },

  getAdjustedStartDate(switchTime) {
    const now = new Date();
    const [hour, minute] = switchTime.split(":").map(Number);
    const switchDate = new Date(now);
    switchDate.setHours(hour, minute, 0, 0);

    if (now > switchDate) {
      now.setDate(now.getDate() + 1);
    }
    return now;
  },

  formatDate(date) {
    return date.toISOString().slice(0, 10);
  }
});
