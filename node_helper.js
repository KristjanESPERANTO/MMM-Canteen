const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting module helper: ${this.name}`);
  },

  async socketNotificationReceived (notification, payload) {
    if (!notification.startsWith("CANTEEN_REQUEST")) {
      return;
    }

    const identifier = notification.substring("CANTEEN_REQUEST".length + 1);
    await this.collectData(identifier, payload);
  },

  async collectData (identifier, payload) {
    const maxAttempts = 7;
    const data = {identifier};
    let extraDays = 0;
    let done = false;

    const date = this.getAdjustedStartDate(payload.switchTime);
    data.date = this.formatDate(date);

    // Check if canteen exists in new API and determine which API to use
    const useNewAPI = await this.checkCanteenInNewAPI(identifier, payload.canteen);

    while (extraDays < maxAttempts && !done) {
      const requestURL = useNewAPI
        ? `https://openmensa.jolo.software/api/v2/canteens/${payload.canteen}/days/${data.date}/meals`
        : `https://openmensa.org/api/v2/canteens/${payload.canteen}/days/${data.date}/meals`;

      Log.debug(`[${identifier}] requestURL: ${requestURL}`);

      try {
        const response = await fetch(requestURL);

        if (response.status === 404) {
          Log.info(`[${identifier}] Mensa closed on ${data.date}, trying next day…`);
          data.extraDays = extraDays;
          this.sendSocketNotification(`CANTEEN_RESPONSE-CLOSED-${identifier}`, data);

          date.setDate(date.getDate() + 1);
          data.date = this.formatDate(date);
          extraDays += 1;
        } else {
          const meals = await response.json();
          Log.info(`[${identifier}] Received menu for ${data.date}.`);
          Log.debug(`[${identifier}] Meals:`, meals);

          data.meals = this.filterMeals(meals, payload);
          this.sendSocketNotification(`CANTEEN_RESPONSE-MEALS-${identifier}`, data);
          done = true;
        }
      } catch (error) {
        Log.error(`[${identifier}] Error fetching meals: ${error}`);
        break;
      }
    }
  },

  async checkCanteenInNewAPI (identifier, canteenId) {
    try {
      const response = await fetch(`https://openmensa.jolo.software/api/v2/canteens/${canteenId}`);
      if (response.status === 200) {
        Log.info(`[${identifier}] Found canteen in new API, using new endpoint.`);
        return true;
      }
    } catch (error) {
      Log.debug(`[${identifier}] New API check failed: ${error}`);
    }
    Log.info(`[${identifier}] Canteen not in new API, falling back to old API.`);
    return false;
  },

  getAdjustedStartDate (switchTime) {
    const now = new Date();
    const [hour, minute] = switchTime.split(":").map(Number);
    const switchDate = new Date(now);
    switchDate.setHours(hour, minute, 0, 0);

    if (now > switchDate) {
      now.setDate(now.getDate() + 1);
    }
    return now;
  },

  formatDate (date) {
    return date.toISOString().slice(0, 10);
  },

  filterMeals (meals, config) {
    let filtered = meals;
    if (config.showOnlyKeywords.length > 0) {
      filtered = filtered.filter((meal) => this.isInMeal(meal, config.showOnlyKeywords));
    }
    if (config.blacklistKeywords.length > 0) {
      filtered = filtered.filter((meal) => !this.isInMeal(meal, config.blacklistKeywords));
    }
    return filtered;
  },

  isInMeal (meal, keywords) {
    if (!meal || !Array.isArray(meal.notes) || typeof meal.category !== "string") {
      return false;
    }
    const notes = meal.notes.map((note) => note.toLowerCase());
    const category = meal.category.toLowerCase();
    return keywords.some((keyword) => {
      const key = keyword.toLowerCase();
      return notes.includes(key) || category.includes(key);
    });
  }
});
