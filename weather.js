const app = {
  inite: () => {
    window.addEventListener("load", app.getWeatherForecast);
    window.addEventListener("load", app.fetchCurrentWeather);
  },
  getWeatherForecast: () => {
    let data = app.checkCache();
    if (data) {
      console.log(data);
      app.showWetherUi(data);
    } else {
      // Get the user current location
      app.getlocation(
        (position) => {
          // Success callback: make a request to the WatherBit API to get the weather forecast
          const key = config.API_KEY_WEATHERBIT;
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const units = "metric";
          const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&units=${units}&key=${key}`;

          fetch(url)
            .then((response) => {
              if (response.ok) {
                console.log("Scucesses fetching");
                return response.json();
              } else {
                throw new Error("Something went wrong");
              }
            })
            .then((response) => {
              let cachedData = localStorage.getItem("weatherData");
              if (cachedData) {
                return JSON.parse(cachedData);
              } else {
                localStorage.setItem("weatherData", JSON.stringify(response));
                localStorage.setItem("lastUpdated", Date.now());
                return response;
              }
            })
            .then((data) => {
              console.log(data);
              app.showWetherUi(data);
            })
            .catch((error) => {
              console.error(
                error +
                  "Failed to get the wether for wetherbit API or from cache"
              );
            })
            .catch((error) => {
              console.error(error);
            });
        },
        (error) => {
          console.error(error);
        }
      );
    }
  },
  fetchData: (position) => {},
  checkCache: () => {
    let cachedData = localStorage.getItem("weatherData");
    let lastUpdated = localStorage.getItem("lastUpdated");
    let currentTime = Date.now();
    // If it is and it was updated within the last hour
    if (cachedData && lastUpdated && currentTime - lastUpdated < 3600000) {
      console.log("suceess");
      // Parse the JSON and return it
      let data = JSON.parse(cachedData);
      return data;
    }
    return null;
  },
  fetchCurrentWeather: () => {
    app.getlocation(
      (position) => {
        // Success callback: make a request to the OpenWeatherMap API to get the weather forecast
        const key = config.API_KEY;
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const units = "metric";
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;

        fetch(url)
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Something went wrong");
            }
          })
          .then((data) => {
            app.displayBackground(data);
          })
          .catch((error) => {
            console.error(error);
          });
      },
      (error) => {
        console.error(error);
      }
    );
  },
  displayBackground: (data) => {
    const weather = {
      temperature: data.main.temp,
      precipitation: data.rain ? data.rain["3h"] : 0,
      precipitationType: data.snow ? "snow" : "rain",
      cloudCover: data.clouds.all / 100,
      isNight: data.sys,
      clouds: data.clouds,
    };
    console.log(weather);
    const background = app.setWeatherBackground(weather);
    document.querySelector("#live-bg").src = background;
  },
  setWeatherBackground: (weather) => {
    let background = "/assets/clear-skies.mp4";
    const currentTime = new Date().getTime();
    // Calculate the sunset and sunrise times in milliseconds since the epoch
    const sunsetTime = new Date(weather.isNight.sunset * 1000).getTime();
    const sunriseTime = new Date(weather.isNight.sunrise * 1000).getTime();
    if (currentTime > sunsetTime || currentTime < sunriseTime) {
      // If it is currently after sunset or before sunrise, night
      background = "/assets/clear-skies-night.mp4";
    } else if (weather.isNight.id >= 500 && weather.isNight.id < 600) {
      // If it is not night time and there is rain
      background = "";
    } else if (weather.clouds.all >= 50) {
      // If it is not night time and there is no precipitation, but the cloud cover is greater than 50%
      background = "/assets/cloudy-skies.mp4";
    }
    return background;
  },

  showWetherUi: (response) => {
    let content = "";
    response.data.map((day, index) => {
      let datetime = day.datetime;
      let date = new Date(datetime);
      let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      let dayInString = days[date.getUTCDay()];
      content += `
        <div class="wether_card_item">
        <div class="card-body">
        <div class="day_container">
        <h5 class="card-title day">${dayInString}</h5>
        </div>

          <img src='https://www.weatherbit.io/static/img/icons/${day.weather.icon}.png' alt="Weather Icon" class="forecast_icon">
          <div class="temp_container">
          <p class="card-text">Max: ${day.app_max_temp}°C</p>
          <p class="card-text">Min: ${day.app_min_temp}°C</p>
          </div>
     
      </div>
              </div>
      `;
      document.querySelector(".wether_forecast").innerHTML = content;
    });
    //   "Max Temp: " + maxTemp + " " + "/ " + "Min temp: " + minTemp;
  },
  getlocation: (success, error) => {
    navigator.geolocation.getCurrentPosition(success, error);
  },
};
app.inite();
