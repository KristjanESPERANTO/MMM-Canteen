/* global config, Log, Module */

Module.register(
  "MMM-Canteen",
  {
    defaults: {
      updateInterval: 20 * 60 * 1000, // 20 minutes
      canteen: 63,
      status: "employees", // Choose between "employees", "students", "pupils" and "others"
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

    start() {
      Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);
      this.loadData();
      this.scheduleUpdate();
      this.updateDom();
    },

    scheduleUpdate() {
      setInterval(() => {
        this.loadData();
      }, this.config.updateInterval);
    },

    loadData() {
      this.sendSocketNotification(
        `CANTEEN_REQUEST-${this.identifier}`,
        this.config,
      );
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
      if (notificationIdentifier === `CANTEEN_RESPONSE-CLOSED-${this.identifier}`) {
        this.loading = false;
        const date = new Date(payload.date);
        this.date = date.toLocaleDateString(config.locale || config.language);
        this.extraDays = payload.extraDays;
        Log.log("[MMM-Canteen] Mensa hat heute geschlossen!");
        this.date = "";
        this.closed = true;
        this.updateDom(this.config.animationSpeed);
      }
      if (notificationIdentifier === `CANTEEN_RESPONSE-MEALS-${this.identifier}`) {
        this.loading = false;
        const date = new Date(payload.date);
        this.date = date.toLocaleDateString(config.locale || config.language);
        this.extraDays = payload.extraDays;
        if (payload.meals.length) {
          this.closed = false;

          // Show only keywords
          payload.meals = payload.meals.filter(meal => this.config.showOnlyKeywords.length ? isInMeal(meal, this.config.showOnlyKeywords) : true)

          // Blacklist keywords
          payload.meals = payload.meals.filter(meal => this.config.blacklistKeywords.length ? !isInMeal(meal, this.config.blacklistKeywords) : true)

          this.meals = payload.meals;
          Log.debug(`[MMM-Canteen] ${this.meals}`);
          this.updateDom(this.config.animationSpeed);
        }
      }
    },
  }
);

function isInMeal(meal, keywords) {
  for (const keyword of keywords) {
    if (meal.notes.map((note) => note.toLowerCase()).includes(keyword.toLowerCase()) || meal.category.toLowerCase().includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}
