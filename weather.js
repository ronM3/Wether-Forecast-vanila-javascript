const app = {
  inite: () => {
    window.addEventListener("load", app.getWeatherForecast);
    window.addEventListener("load", app.fetchCurrentWeather);
  },
  getWeatherForecast: () => {
    // Check if the data is already in the cache
    let cachedData = localStorage.getItem("weatherData");
    let lastUpdated = localStorage.getItem("lastUpdated");
    let currentTime = Date.now();
    // If it is and it was updated within the last hour
    if (cachedData && lastUpdated && currentTime - lastUpdated < 3600000) {
      // Parse the JSON and return it
      let data = JSON.parse(cachedData);
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
            app.showMapInUi(data);
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
  showMapInUi: (data) => {
    const weather = {
      temperature: data.main.temp,
      precipitation: data.rain ? data.rain["3h"] : 0,
      precipitationType: data.snow ? "snow" : "rain",
      cloudCover: data.clouds.all / 100,
      isNight: data.sys,
      clouds: data.clouds,
    };
    console.log(weather);
    const map = app.getWeatherMap(weather);
    document.querySelector("#live-bg").src = map;
  },
  getWeatherMap: (weather) => {
    let map = "/assets/clear-skies.mp4";
    const currentTime = new Date().getTime();
    // Calculate the sunset and sunrise times in milliseconds since the epoch
    const sunsetTime = new Date(weather.isNight.sunset * 1000).getTime();
    const sunriseTime = new Date(weather.isNight.sunrise * 1000).getTime();
    if (currentTime > sunsetTime || currentTime < sunriseTime) {
      // If it is currently after sunset or before sunrise, night
      map = "/assets/clear-skies-night.mp4";
    } else if (weather.isNight.id >= 500 && weather.isNight.id < 600) {
      // If it is not night time and there is rain
      map = "";
    } else if (weather.clouds.all >= 50) {
      // If it is not night time and there is no precipitation, but the cloud cover is greater than 50%
      map = "/assets/cloudy-skies.mp4";
    }
    return map;
  },

  showWetherUi: (response) => {
    const body = document.querySelector("body");
    const row = document.querySelector(".row");
    console.log(response);

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
      console.log(dayInString); // "Saturday"
      content += `
        <div class="col-md-4 mt-4">
        <div class="card text-center">
        <div class="card-body">
          <h5 class="card-title">${dayInString}</h5>
          <p class="card-text">Maximum Temperature: ${day.app_max_temp}°F</p>
          <p class="card-text">Minimum Temperature: ${day.app_min_temp}°F</p>
          <img src='https://www.weatherbit.io/static/img/icons/${day.weather.icon}.png' alt="Weather Icon">
        </div>
      </div>
              </div>
      `;
      document.querySelector(".row").innerHTML = content;
    });
    //   "Max Temp: " + maxTemp + " " + "/ " + "Min temp: " + minTemp;
  },
  getlocation: (success, error) => {
    navigator.geolocation.getCurrentPosition(success, error);
  },
};
app.inite();
