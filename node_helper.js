var NodeHelper = require('node_helper');
const axios = require('axios').default;
var moment = require('moment');


module.exports = NodeHelper.create({

  start: function() {
    console.log("Starting module helper: " + this.name);
  },


  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG') {
      this.config = payload;
      this.collectData();
      self = this;
      setInterval(function () {
        self.collectData();
      }, 60 * 1000 * 30);
    }
  },

  /*
  self.sendSocketNotification("EXTRADAYS", extraDays);
  self.sendSocketNotification("MEALS", body);
  self.sendSocketNotification("API_ERROR", null);
  */
  collectData: async function () {
    var today;
    if (moment() < moment(this.config.switchTime, "HH:mm")) {
     today = moment().format("YYYY-MM-DD");
    } else {
     today = moment().add(1, "days").format("YYYY-MM-DD");
    }
    let self = this;
    let done = false;
    let extraDays = 0;
    while(!done)
    {
      let url = 'http://openmensa.org/api/v2/canteens/'+this.config.canteen+'/days/'+today+'/meals';
      let meals = null;
      console.log("[MMM-CANTEEN] Checking for: " + today, " (", url, ")");
      await axios.get(url).then(function(response){
        console.log(response.status);
        done = true;
        meals = response.data;

        self.sendSocketNotification("EXTRADAYS", extraDays);
        self.sendSocketNotification("MEALS", meals);
      }).catch(function (error){
        console.log("[MMM-Canteen] Mensa closed on ", today, " trying again...");
        extraDays++;
        today = moment().add(extraDays, "days").format("YYYY-MM-DD");
      })
    }
  }
});
