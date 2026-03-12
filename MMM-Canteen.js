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
    showVeggieColumn: true,
    showOnlyKeywords: [],
    blacklistKeywords: []
  },

  loading: true,
  closed: false,
  meals: [],
  date: "",
  extraDays: 0,

  start () {
    Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);
    this.loadData();
    this.scheduleUpdate();
    this.updateDom();
  },

  scheduleUpdate () {
    setInterval(() => this.loadData(), this.config.updateInterval);
  },

  loadData () {
    this.sendSocketNotification(`CANTEEN_REQUEST-${this.identifier}`, this.config);
  },

  getStyles () {
    return ["MMM-Canteen.css"];
  },

  getDom () {
    const wrapper = document.createElement("div");

    const header = document.createElement("header");
    header.textContent = `${this.config.canteenName}      ${this.date}`;
    wrapper.appendChild(header);

    if (this.loading) {
      const loading = document.createElement("div");
      loading.classList.add("small", "dimmed", "light");
      loading.textContent = this.translate("LOADING");
      wrapper.appendChild(loading);
      return wrapper;
    }

    if (this.closed) {
      const closed = document.createElement("div");
      closed.classList.add("small");
      closed.innerHTML = `Kein Speiseplan für die <br> nächsten ${this.extraDays} Tage verfügbar.`;
      wrapper.appendChild(closed);
      return wrapper;
    }

    wrapper.appendChild(this.buildTable());
    return wrapper;
  },

  buildTable () {
    const tableWrapper = document.createElement("div");
    tableWrapper.classList.add("wrapper");
    const table = document.createElement("table");
    table.appendChild(this.buildTableHeader());
    const tbody = document.createElement("tbody");
    for (const meal of this.meals) {
      tbody.appendChild(this.buildMealRow(meal));
    }
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    return tableWrapper;
  },

  buildTableHeader () {
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.classList.add("bold");

    const thTitle = document.createElement("td");
    thTitle.classList.add("title");
    thTitle.textContent = "Gericht";
    headerRow.appendChild(thTitle);

    const thPrice = document.createElement("td");
    thPrice.classList.add("price");
    thPrice.textContent = "Preis";
    headerRow.appendChild(thPrice);

    if (this.config.showVeggieColumn) {
      const thVeggie = document.createElement("td");
      thVeggie.classList.add("veggie");
      thVeggie.textContent = "veggie";
      headerRow.appendChild(thVeggie);
    }

    thead.appendChild(headerRow);
    return thead;
  },

  buildMealRow (meal) {
    const row = document.createElement("tr");
    row.classList.add("light", "bright");
    const hasPrice = meal.prices[this.config.status] > 0;

    const tdTitle = document.createElement("td");
    tdTitle.classList.add("title");
    tdTitle.textContent = this.truncateText(meal.name, this.config.truncate);
    row.appendChild(tdTitle);

    const tdPrice = document.createElement("td");
    tdPrice.classList.add("price");
    if (hasPrice) {
      tdPrice.textContent = meal.prices[this.config.status].toLocaleString("de-DE", {style: "currency", currency: "EUR"});
    }
    row.appendChild(tdPrice);

    if (this.config.showVeggieColumn) {
      row.appendChild(this.buildVeggieCell(meal, hasPrice));
    }

    return row;
  },

  buildVeggieCell (meal, hasPrice) {
    const td = document.createElement("td");
    if (!hasPrice) {
      td.classList.add("veggie");
      return td;
    }
    const notes = meal.notes || [];
    const category = meal.category || "";
    if (notes.includes("vegan") || category === "Vegan") {
      td.classList.add("veggie", "vegan");
      td.textContent = "vegan";
    } else if (notes.includes("vegetarisch") || category === "Vegetarisch") {
      td.classList.add("veggie", "vegetarian");
      td.textContent = "veget.";
    } else {
      td.classList.add("veggie");
      td.textContent = "-";
    }
    return td;
  },

  truncateText (text, length) {
    if (text.length <= length) {
      return text;
    }
    return `${text.slice(0, length)}…`;
  },

  socketNotificationReceived (notificationIdentifier, payload) {
    const isClosed = notificationIdentifier === `CANTEEN_RESPONSE-CLOSED-${this.identifier}`;
    const isMeals = notificationIdentifier === `CANTEEN_RESPONSE-MEALS-${this.identifier}`;

    if (!isClosed && !isMeals) {
      return;
    }

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
      let {meals} = payload;

      // Apply showOnlyKeywords filter
      if (this.config.showOnlyKeywords.length > 0) {
        meals = meals.filter((meal) => this.isInMeal(meal, this.config.showOnlyKeywords));
      }

      // Apply blacklistKeywords filter
      if (this.config.blacklistKeywords.length > 0) {
        meals = meals.filter((meal) => !this.isInMeal(meal, this.config.blacklistKeywords));
      }

      this.meals = meals;
      this.closed = false;

      Log.debug("[MMM-Canteen] Filtered meals:", meals);
      this.updateDom(this.config.animationSpeed);
    }
  },
  // Helper function
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
