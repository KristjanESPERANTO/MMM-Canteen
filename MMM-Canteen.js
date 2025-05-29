/* global config, Log, Module */

Module.register("MMM-Canteen", {
  defaults: {
    updateInterval: 20 * 60 * 1000, // 20 minutes
    canteen: 63,
    status: "employees", // Choose between "employees", "students", "pupils", "others"
    truncate: 100,
    switchTime: "16:00",
    canteenName: "Kantine",
    animationSpeed: 500,
    showVeggieColumn: false,
    showOnlyKeywords: [],
    blacklistKeywords: []
  },

  loading: true,
  closed: false,
  meals: [],
  date: "",
  extraDays: 0,

  start() {
    Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);
    this.loadData();
    this.scheduleUpdate();
    this.updateDom();
  },

  scheduleUpdate() {
    setInterval(() => this.loadData(), this.config.updateInterval);
  },

  loadData() {
    this.sendSocketNotification(`CANTEEN_REQUEST-${this.identifier}`, this.config);
  },

  getStyles() {
    return ["MMM-Canteen.css"];
  },

  getTemplate() {
    return "MMM-Canteen.njk";
  },

  getTemplateData() {
    Log.log("[MMM-Canteen] Updating template data");
    return {
      date: this.date,
      extraDays: this.extraDays,
      config: this.config,
      loading: this.loading,
      meals: this.meals,
      closed: this.closed
    };
  },

  socketNotificationReceived(notificationIdentifier, payload) {
    const isClosed = notificationIdentifier === `CANTEEN_RESPONSE-CLOSED-${this.identifier}`;
    const isMeals = notificationIdentifier === `CANTEEN_RESPONSE-MEALS-${this.identifier}`;

    if (!isClosed && !isMeals) return;

    const dateObj = new Date(payload.date);
    const locale = config.locale || config.language || "en";
    this.date = dateObj.toLocaleDateString(locale);
    this.extraDays = payload.extraDays;
    this.loading = false;

    if (isClosed) {
      Log.info(`[MMM-Canteen] ${this.config.canteenName} is closed on ${this.date}`);
      this.date = "";
      this.closed = true;
      this.updateDom(this.config.animationSpeed);
      return;
    }

    if (Array.isArray(payload.meals) && payload.meals.length) {
      let meals = payload.meals;

      // Apply showOnlyKeywords filter
      if (this.config.showOnlyKeywords.length > 0) {
        meals = meals.filter(meal => isInMeal(meal, this.config.showOnlyKeywords));
      }

      // Apply blacklistKeywords filter
      if (this.config.blacklistKeywords.length > 0) {
        meals = meals.filter(meal => !isInMeal(meal, this.config.blacklistKeywords));
      }

      this.meals = meals;
      this.closed = false;

      Log.debug(`[MMM-Canteen] Filtered meals:`, meals);
      this.updateDom(this.config.animationSpeed);
    }
  }
});

// Helper function
function isInMeal(meal, keywords) {
  if (!meal || !Array.isArray(meal.notes) || typeof meal.category !== "string") return false;

  const notes = meal.notes.map(note => note.toLowerCase());
  const category = meal.category.toLowerCase();

  return keywords.some(keyword => {
    const key = keyword.toLowerCase();
    return notes.includes(key) || category.includes(key);
  });
}
