/* global config, Log, Module */

Module.register(
  "MMM-Canteen",
  {
    defaults: {
      updateInterval: 10 * 60 * 1000, // 10 minutes
      canteen: 63,
      status: "employees", // Choose between "employees", "students", "pupils" and "others"
      truncate: 100,
      switchTime: "16:00",
      debug: false,
      canteenName: "Kantine",
      animationSpeed: 500,
      showVeggieColumn: true,
      showOnlyKeywords: ["vegan", "vegetarisch", "vegetarische"],
      blacklistKeywords: []
    },

    loading: true,
    closed: false,
    meals: [],

    start () {
      Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);
      this.sendSocketNotification(
        "CONFIG",
        {
          config: this.config,
          identifier: this.identifier
        }
      );
    },

    getStyles () {
      return ["MMM-Canteen.css"];
    },

    getTemplate () {
      return "MMM-Canteen.njk";
    },

    getTemplateData () {
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

    socketNotificationReceived (notification, payload) {
      if (this.identifier === payload.identifier) {
        Log.info(`[MMM-Canteen] Socket Notification received: ${notification}`);
        this.loading = false;
        const date = new Date(payload.date);
        this.date = date.toLocaleDateString(config.locale || config.language);
        this.extraDays = payload.extraDays;

        if (notification === "MEALS") {
          if (payload.meals.length) {
            this.closed = false;

            // Show only keywords
            payload.meals = filter(payload.meals, meal => isInMeal(meal, this.config.showOnlyKeywords) ? this.config.showOnlyKeywords : true)

            // Blacklist keywords
            payload.meals = filter(payload.meals, meal => !isInMeal(meal, this.config.blacklistKeywords) ? this.config.blacklistKeywords : true)

            this.meals = payload.meals;
            Log.debug(`[MMM-Canteen] ${this.meals}`);
          }
        } else if (notification === "CLOSED") {
          Log.log("[MMM-Canteen] Mensa hat heute geschlossen!");
          this.date = "";
          this.closed = true;
        }
        this.updateDom(this.config.animationSpeed);
      }
    },

    log (msg) {
      if (this.config && this.config.debug) {
        Log.info(`${this.name}: ${JSON.stringify(msg)}`);
      }
    }
  }
);

function isInMeal(meal, showOnlyKeywords) {
  for (const keyword of showOnlyKeywords) {
    if (meal.notes.lower().includes(keyword.lower()) || meal.category.lower().includes(keyword.lower())) {
      return true;
    }
  }
  return false;
}
