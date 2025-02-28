/* global dayjs, Log, Module */

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
      showVeggieColumn: true
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

    getScripts () {
      return [this.file("node_modules/dayjs/dayjs.min.js")];
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
        this.date = dayjs(
          payload.date,
          "YYYY-MM-DD"
        ).format("DD.MM.YYYY");
        this.extraDays = payload.extraDays;

        if (notification === "MEALS") {
          if (payload.meals.length) {
            this.closed = false;
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
