const app = {
  inite: () => {
    window.addEventListener("load", app.fetchWeather);
    window.addEventListener("load", app.updateWetherMap);
  },
  fetchWeather: () => {
    // Get the user current location
    app.getlocation(
      (position) => {
        // Success callback: make a request to the OpenWeatherMap API to get the weather forecast
        const key = config.API_KEY;
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const units = "metric";
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
        // const url2 = `https://weatherbit-v1-mashape.p.rapidapi.com/forecast/daily?lat=${lat}&lon=${lon}&units=${units}&key=${key2}`;

        fetch(url)
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Something went wrong");
            }
          })
          .then((data) => {
            console.log(data);
            app.showWetherUi(data);
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
  updateWetherMap: () => {
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

  showWetherUi: (data) => {
    const body = document.querySelector("body");
    const row = document.querySelector(".row");
    // const temperature = data.main.temp;
    // const description = data.weather[0].description;
    // const maxTemp = data.main.temp_max;
    // const minTemp = data.main.temp_min;
    // document.getElementById("temperature").innerHTML = temperature;
    // document.getElementById("description").innerHTML = description;
    // document.getElementById("maxTemp").innerHTML =
    //   "Max Temp: " + maxTemp + " " + "/ " + "Min temp: " + minTemp;
  },
  getlocation: (success, error) => {
    navigator.geolocation.getCurrentPosition(success, error);
  },
};
app.inite();
