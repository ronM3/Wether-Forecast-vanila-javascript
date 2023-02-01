const defaultLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const app = {
  inite: () => {
    window.addEventListener("load", app.getWeatherForecast);
    window.addEventListener("load", app.getCurrentWeather);
    setInterval(app.getCurrentWeather, 3600000);
  },
  getWeatherForecast: () => {
    let data = app.checkCache();
    if (data) {
      console.log(data);
      app.showForecastWeather(data);
    } else {
      app.getlocation(
        (position) => {
          app
            .fetchForecastData(position)
            .then((data) => {
              console.log(data);
              app.showForecastWeather(data);
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
  fetchForecastData: async (position) => {
    const key = config.API_KEY_WEATHERBIT;
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const units = "metric";
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&units=${units}&key=${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Something went wrong");
      }
      const data = await response.json();
      localStorage.setItem("weatherData", JSON.stringify(data));
      localStorage.setItem("lastUpdated", Date.now());
      return data;
    } catch (error) {
      throw error;
    }
  },
  checkCache: () => {
    let cachedData = localStorage.getItem("weatherData");
    let lastUpdated = localStorage.getItem("lastUpdated");
    let currentTime = Date.now();
    let developerMode = false;
    if (developerMode) {
      let data = JSON.parse(cachedData);
      return data;
    }
    // If data and timestamp exist in cache and last updated time is within the last hour
    if (cachedData && lastUpdated && currentTime - lastUpdated < 3600000) {
      console.log("Data retrieved from cache.");
      let data = JSON.parse(cachedData);
      return data;
    } else {
      console.log("No data in cache or data too old. Fetching from API.");
      return null;
    }
  },
  fetchCurrentWeather: async (position) => {
    const key = config.API_KEY;
    const lon = position.coords
      ? position.coords.longitude
      : defaultLocation.longitude;
    const lat = position.coords
      ? position.coords.latitude
      : defaultLocation.latitude;
    const units = "metric";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Something went wrong");
      }
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      throw error;
    }
  },
  getCurrentWeather: () => {
    app.getlocation(
      (position) => {
        if (!position) {
          position = defaultLocation;
        }
        app
          .fetchCurrentWeather(position)
          .then((data) => {
            app.displayBackground(data);
            app.displayCurrentWeather(data);
            // app.displayCurrentInfo(data);
            app.getWeatherSummary(data);
          })
          .catch((error) => {
            console.error(error);
          });
      },
      (error) => {
        app.handleFallback(error);
      }
    );
  },
  getCurrentTimeAndDate: (data) => {
    let sunRiseSunSet = app.getSunriseSunset(data);
    let currentDate = new Date((data.dt + data.timezone) * 1000);
    let dayOfWeek = currentDate.toLocaleString("en-US", { weekday: "long" });
    let month = currentDate.toLocaleString("en-US", { month: "short" });
    let day = currentDate.getDate();
    const today = new Date();
    const hour = today.getHours();
    const minutes = today.getMinutes();
    const am_pm = hour >= 12 ? "PM" : "AM";
    const DateAndTime = {
      sunRiseSunSet,
      currentDate,
      dayOfWeek,
      month,
      day,
      hour,
      minutes,
      am_pm,
    };
    return DateAndTime;
  },
  displayCurrentInfo: (data) => {
    const currentWeatherData = app.getCurrentTimeAndDate(data);
    const timeContainer = app.createTimeContainer(currentWeatherData);
    const date = app.createDate(currentWeatherData);
    const content = `<div>
      ${timeContainer}
      ${date}
      </div>`;
    //   document.querySelector(".row.current").insertAdjacentHTML('afterend', content);
    // document.querySelector(".info").innerHTML = content;
  },
  displayCurrentWeather: (data) => {
    const currentWeatherData = app.getCurrentTimeAndDate(data);
    const weatherCard = app.createWeatherCard(data, currentWeatherData);
    const weatherContainer = document.querySelector(".row.current");
    const CurrentTempCol = document.querySelector(
      ".col-sm-12.mt-4.current_temp_card"
    );
    if (CurrentTempCol) {
      weatherContainer.removeChild(CurrentTempCol);
    }
    const newCol = document.createElement("div");
    newCol.classList.add("col-sm-12", "mt-4", "current_temp_card");
    newCol.innerHTML = `
    <div class="current_temp_container">
    <span class="current_temp mt-4">${data.main.temp}°C</span>
    <div class="current_hum_wind">
    <div class="inner_humidity">
    <span class="humidity">${data.main.humidity}</span>
    <img class="current__gif humidity" src="./assets/humidity2.gif">
    </div>
    <div class="inner_wind">
    <span class="current_wind">Wind:${data.wind.speed}mph</span>
    <img class="current__gif wind" src="./assets/wind.gif">
    </div
    </div>
    </div>
        ${weatherCard}
      </div>`;
    document.querySelector(".row.current").appendChild(newCol);
  },
  createTimeContainer: (data) => {
    return `<div class="time_container">
      <span class="time mt-4">${data.hour}:${data.minutes}</span>
      <span class="time_am_pm">${data.am_pm}</span>
      </div>`;
  },
  createDate: (data) => {
    return `<span class="date mt-4">${data.dayOfWeek} ${data.day} ${data.month}</span>`;
  },
  createWeatherCard: (data, currentWeatherData) => {
    return `<div class="current_weather_card mt-4">
      <div class="card_body_current">
        <div class="wether_info">
        <h5 class="card-title">Feels like:</h5>
        <h5 class="card-title">${data.main.feels_like}°C</h5>
        </div>
        <div class="wether_info">
        <h5 class="card-title">sunrise: </h5>
        <h5 class="card-title">${currentWeatherData.sunRiseSunSet.sunrise}</h5>
        </div>
        <div class="wether_info">
        <h5 class="card-title">sunset: </h5>
        <h5 class="card-title">${currentWeatherData.sunRiseSunSet.sunset}</h5>
        </div>
      </div>
    </div>`;
  },
  getWeatherSummary: (data) => {
    const weather = data.weather[0];
    const main = data.main;
    const location = data.name;
    const country = data.sys.country;
    let weatherSummary = "";
    if (weather.main === "Clear") {
      weatherSummary = `The current weather in ${location}, ${country} is clear with a temperature of ${main.temp}°C and a humidity level of ${main.humidity}%. The skies are free of clouds and it's a great day to be outside.`;
    } else if (weather.main === "Rain") {
      weatherSummary = `The current weather in ${location}, ${country} is rainy with a temperature of ${main.temp}°C and a humidity level of ${main.humidity}%. It's a good idea to bring an umbrella and a raincoat if you're planning to go out.`;
    } else if (weather.main === "Clouds") {
      weatherSummary = `The current weather in ${location}, ${country} is cloudy with a temperature of ${main.temp}°C and a humidity level of ${main.humidity}%. Although it's not sunny, it's still a comfortable day to be outside.`;
    } else if (weather.main === "Thunderstorm") {
      weatherSummary = `The current weather in ${location}, ${country} is experiencing a thunderstorm with a temperature of ${main.temp}°C and a humidity level of ${main.humidity}%. Please take necessary precautions and stay indoors if possible.`;
    }
    const weatherSummaryInfo = `<div class="col-sm-12 mt-3 mb-4">
      <h4 class="info_city_h">${location} City</h4>
      <span>${weatherSummary}</span>
      </div>`;
    document.querySelector(".info").innerHTML = weatherSummaryInfo;
  },
  displayBackground: (data) => {
    const weather = {
      temperature: data.main.temp,
      precipitation: data.rain ? data.rain["3h"] : 0,
      precipitationType: data.snow ? "snow" : "rain",
      cloudCover: data.clouds.all / 100,
      timeOfDay: data.sys,
      clouds: data.clouds,
      weatherId: data.weather[0].id
    };
    const background = app.setWeatherBackground(weather);
    document.querySelector("#live-bg").src = background;
  },
  setWeatherBackground: (weather) => {
    let background = "/assets/clear-skies.mp4";
    const currentTime = new Date().getTime();
    const sunsetTime = new Date(weather.timeOfDay.sunset * 1000).getTime();
    const sunriseTime = new Date(weather.timeOfDay.sunrise * 1000).getTime();
        // If it is currently after sunset or before sunrise, night cases:
    if (currentTime > sunsetTime || currentTime < sunriseTime) {
        // If it is night time and there is thunderstorm
      if (weather.weatherId >= 200 && weather.weatherId < 300) {
        background = "/assets/thunderstorm_night.mp4";
        // If it is night time and there is rain
      } else if (weather.weatherId >= 500 && weather.weatherId < 600) {
        background = "/assets/rainy_skies_night.mp4";
      } else {
        background = "/assets/clear-skies-night.mp4";
      }
      // day cases:
    } else if (weather.weatherId >= 200 && weather.weatherId < 300) {
      // If it is not night time and there is thunderstorm
      background = "/assets/thunderstorm.mp4";
    } else if (weather.weatherId >= 500 && weather.weatherId < 600) {
      // If it is not night time and there is rain
      background = "/assets/rainy_skies.mp4";
    } else if (weather.clouds.all >= 50) {
      // If it is not night time and there is no precipitation, but the cloud cover is greater than 50%
      background = "/assets/cloudy_skies.mp4";
    }
    return background;
  },
  showForecastWeather: (response) => {
    let minTemps = [];
    let maxTemps = [];
    let tempArr = [];
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
      let dayInString = days[date.getUTCDay()].substring(0, 3);
      tempArr.push({ x: dayInString, y: day.app_max_temp });
      minTemps.push(day.app_min_temp);
      maxTemps.push(day.app_max_temp);
      content += `
          <div class="wether_card_item">
          <div class="card-body">
          <div class="day_container">
          <h5 class="card-title day">${dayInString}</h5>
            </div>
            <img src='https://www.weatherbit.io/static/img/icons/${day.weather.icon}.png' alt="Weather Icon" class="forecast_icon">
            <div class="temp_container">
            <p class="card-text forecast_temp">Max: ${day.app_max_temp}°C</p>
            <p class="card-text forecast_temp">Min: ${day.app_min_temp}°C</p>
            </div>
            </div>
          </div>`;
      document.querySelector(".wether_forecast").innerHTML = content;
    });
    app.displayForecastGraph(tempArr, "forecastGraph");
  },
  displayForecastGraph: (response, graphId) => {
    let graphData = [];
    response.map((day) => {
      graphData.push({ x: day.x, y: day.y });
    });
    console.log(graphData);
    let ctx = document.getElementById(graphId).getContext("2d");
    let chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: response.map((day) => day.x),
        datasets: [
          {
            label: "Temperature",
            data: graphData,
            borderColor: "rgba(255, 222, 23 , 0.7)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,

        legend: {
          display: false,
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  },
  getSunriseSunset: (response) => {
    let sunrise = new Date(response.sys.sunrise * 1000);
    let sunset = new Date(response.sys.sunset * 1000);
    let options = { hour: "numeric", minute: "numeric", hour12: true };
    let sunriseTime = sunrise.toLocaleString("en-US", options);
    let sunsetTime = sunset.toLocaleString("en-US", options);
    return { sunrise: sunriseTime, sunset: sunsetTime };
  },
  getlocation: (success, error) => {
    navigator.geolocation.getCurrentPosition(success, error);
  },
  getLocationOrDefault: (location) => {
    if (!location) {
      return defaultLocation;
    }
    return location;
  },
  handleFallback: (error, func) => {
    if (error.code === error.PERMISSION_DENIED) {
      position = app.getLocationOrDefault(null);
      app
        .fetchCurrentWeather(position)
        .then((data) => {
          app.displayBackground(data);
          app.displayCurrentWeather(data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.error(error);
    }
  },
};
app.inite();
