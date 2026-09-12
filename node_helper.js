const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start () {
    Log.log(`Starting module helper: ${this.name}`);
    this.apiCache = new Map();
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
    const baseURL = await this.getBaseURL(identifier, payload.canteen);
    const startDate = this.getAdjustedStartDate(payload.switchTime);

    // Days are requested in parallel; the first day with meals wins
    const dates = [...Array(maxAttempts).keys()].map((extraDays) => this.addDays(startDate, extraDays));
    const results = await Promise.all(dates.map((date) => this.fetchMealsForDate({identifier, baseURL, payload, date})));
    const openDay = results.find((result) => result.meals);

    if (openDay) {
      this.sendSocketNotification(`CANTEEN_RESPONSE-MEALS-${identifier}`, {
        date: openDay.dateString,
        meals: openDay.meals
      });
      return;
    }

    this.sendSocketNotification(`CANTEEN_RESPONSE-CLOSED-${identifier}`, {
      extraDays: maxAttempts
    });
  },

  addDays (date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  },

  async fetchMealsForDate ({identifier, baseURL, payload, date}) {
    const dateString = this.formatDate(date);
    const requestURL = `${baseURL}/canteens/${payload.canteen}/days/${dateString}/meals`;

    Log.debug(`[${identifier}] requestURL: ${requestURL}`);

    try {
      const response = await fetch(requestURL);

      if (response.ok) {
        const meals = await response.json();
        Log.info(`[${identifier}] Received menu for ${dateString}.`);
        Log.debug(`[${identifier}] Meals:`, meals);
        return {dateString, meals: this.filterMeals(meals, payload)};
      }

      if (response.status === 404) {
        Log.info(`[${identifier}] Mensa closed on ${dateString}.`);
      } else {
        Log.warn(`[${identifier}] Unexpected response status for ${dateString}: ${response.status}`);
      }
    } catch (error) {
      Log.error(`[${identifier}] Error fetching meals for ${dateString}: ${error}`);
    }

    return {dateString, meals: null};
  },

  async getBaseURL (identifier, canteenId) {
    const useNewAPI = await this.checkCanteenInNewAPI(identifier, canteenId);
    return useNewAPI
      ? "https://openmensa.jolo.software/api/v2"
      : "https://openmensa.org/api/v2";
  },

  async checkCanteenInNewAPI (identifier, canteenId) {
    if (this.apiCache.has(canteenId)) {
      return this.apiCache.get(canteenId);
    }
    let useNewAPI = false;
    try {
      const response = await fetch(`https://openmensa.jolo.software/api/v2/canteens/${canteenId}`);
      if (response.status === 200) {
        Log.info(`[${identifier}] Found canteen in new API, using new endpoint.`);
        useNewAPI = true;
      }
    } catch (error) {
      Log.debug(`[${identifier}] New API check failed: ${error}`);
    }
    if (!useNewAPI) {
      Log.info(`[${identifier}] Canteen not in new API, falling back to old API.`);
    }
    this.apiCache.set(canteenId, useNewAPI);
    return useNewAPI;
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
    // Locale "en-CA" formats as YYYY-MM-DD using local date components
    return date.toLocaleDateString("en-CA");
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
