const defaultLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};
const app = {
  inite: () => {
    const searchButton = document.querySelector(".btn-search");
    const searchInput = document.querySelector('.search__input');
    window.addEventListener("load", app.getWeatherForecast);
    window.addEventListener("load", app.getCurrentWeather);
    searchButton.addEventListener("click", function (event) {
      console.log(event + '1');
      event.preventDefault();
      app.searchLocation();
    });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        searchButton.click();
      }
    });
    setInterval(app.getCurrentWeather, 3600000);
  },
  getWeatherForecast: () => {
    let data = app.checkCache();
    if (data) {
      app.showForecastWeather(data);
    } else {
      app.getlocation(
        (position) => {
          app
            .fetchForecastData(position)
            .then((data) => {
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
    const lon = position.coords ? position.coords.longitude : defaultLocation.longitude;
    const lat = position.coords ? position.coords.latitude : defaultLocation.latitude;
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
    const lon = position.coords ? position.coords.longitude : defaultLocation.longitude;
    const lat = position.coords ? position.coords.latitude : defaultLocation.latitude;
    const units = "metric";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Something went wrong");
      }
      const data = await response.json();
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
        app.fetchCurrentWeather(position).then((data) => {
            app.displayBackground(data);
            app.displayCurrentWeather(data);
            // app.displayCurrentInfo(data);
            app.createMapUi(data);
            app.createMainInfo(data);
            app.getWeatherSummary(data);
          })
          .catch((error) => {
            console.error(error);
          });
        app.fetchHourlyForecast(position).then((data) => {
            app.displayForecastGraph(data, "forecastGraph");
        })
          .catch((error)=>{
          console.log(error);
        })
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
    let year = currentDate.getFullYear();
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
      year,
      country: data.sys.country,
      icon: data.weather[0].icon,
    };
    return DateAndTime;
  },
  searchLocation: () => {
    const input = document.querySelector(".search__input");
    const errorBox = document.getElementById('error_msg');
    // Fetch API from weatherbit API
    const currentKey = config.API_KEY;
    const forecastKey = config.API_KEY_WEATHERBIT;
    const units = "metric";
    fetch(`https://api.weatherbit.io/v2.0/forecast/daily?city=${input.value}&units=${units}&key=${forecastKey}`)
      .then((response) => response.json()).then((data) => {
        app.showForecastWeather(data);
      })
      .catch((error) => console.error(error));
    // Fetch API from OpenWeatherMap API
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${input.value}&units=${units}&appid=${currentKey}`)
      .then((response) => response.json()).then((data) => {
        console.log(data);
        app.displayBackground(data);
        app.displayCurrentWeather(data);
        app.createMapUi(data);
        app.createMainInfo(data);
        app.getWeatherSummary(data);
      })
      .catch((error) => {
        console.log(error);
        errorBox.innerText = "No results found"
      });

    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${input.value}&units=${units}&appid=${currentKey}`)
      .then((response) => response.json()).then((data) => {
        app.displayForecastGraph(data, "forecastGraph");
      })
      .catch((error) => {
        console.log(error);
        errorBox.innerText = "No results found"
      });
      input.value = "";
  },
  // searchLocation: async () => {
  //   const input = document.querySelector(".search__input");
  //   const errorBox = document.getElementById('error_msg');
  //   const currentKey = config.API_KEY;
  //   const forecastKey = config.API_KEY_WEATHERBIT;
  //   const units = "metric";
    
  //   try {
  //     const [weatherData, forecastWeekly, forecasHourly] = await Promise.all([
  //       fetch(`https://api.openweathermap.org/data/2.5/weather?q=${input.value}&units=${units}&appid=${currentKey}`).then(res => res.json()),
  //       fetch(`https://api.weatherbit.io/v2.0/forecast/daily?city=${input.value}&units=${units}&key=${forecastKey}`).then(res => res.json()),
  //       fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${input.value}&units=${units}&appid=${currentKey}`).then(res => res.json())
  //     ]);
  //     console.log(weatherData);
  //     app.displayBackground(weatherData);
  //     app.displayCurrentWeather(weatherData);
  //     app.createMapUi(weatherData);
  //     app.createMainInfo(weatherData);
  //     app.getWeatherSummary(weatherData);
  //     app.showForecastWeather(forecastWeekly);
  //     app.displayForecastGraph(forecasHourly, "forecastGraph");
  //     input.value = "";
  //   } catch (error) {
  //     console.error(error);
  //     console.log(error);
  //     errorBox.innerText = "Something went wrong";
  //   }
  // },
  // displayCurrentInfo: (data) => {
  //   const currentWeatherData = app.getCurrentTimeAndDate(data);
  //   const timeContainer = app.createTimeContainer(currentWeatherData);
  //   const date = app.createDate(currentWeatherData);
  //   const content = `<div>
  //     ${timeContainer}
  //     ${date}
  //     </div>`;
  //   //   document.querySelector(".row.current").insertAdjacentHTML('afterend', content);
  //   // document.querySelector(".info").innerHTML = content;
  // },
  fetchHourlyForecast: async (position) => {
    const key = config.API_KEY;
    const lon = position.coords ? position.coords.longitude : defaultLocation.longitude;
    const lat = position.coords ? position.coords.latitude : defaultLocation.latitude;
    const units = "metric";
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Something went wrong");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
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
  createMapUi: (data) => {
    let { lat, lon } = data.coord;
    return `<div class="col-sm-5 col-sm-offset-2 mb-5">
    <div class="google-map">
    <iframe width=370 height=350 style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${lat},${lon}&hl=es;z=14&output=embed"></iframe>
    </div>
     </div>
    `;
  },
  createMainInfo: (data) => {
    const currentWeatherData = app.getCurrentTimeAndDate(data);
    const dateAndInfo = app.createDateAndInfo(data, currentWeatherData);
    const mainHeader = app.createMainHeader(data);
    const mainTimezone = app.createMainTimezone(data);
    const googleMap = app.createMapUi(data);
    const mainContent = `
    ${mainHeader}
    ${mainTimezone}
    ${dateAndInfo}
    ${googleMap}
   `;
    document.querySelector(".row.main").innerHTML = mainContent;
  },
  createMainHeader: (data) => {
    return `<div class="col-xs-6 mt-5">
      <div class="main_header">
          <h4 class="main_small_h">Weather Forecast</h4>
          <span class="main_big_h first">${data.weather[0].main}</span><span class="main_big_h second">with ${data.weather[0].description}</span>
      </div>
  </div>`;
  },
  createMainTimezone: (data) => {
    const timezone = data.timezone;
    let { lat, lon } = data.coord;
    const sign = timezone < 0 ? "-" : "+";
    const hours = Math.floor(Math.abs(timezone) / 3600);
    const minutes = Math.floor((Math.abs(timezone) % 3600) / 60);
    const timezoneString = `GMT${sign}${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    return `<div class="col-xs-3 col-sm-offset-3 mt-5">
    <div class="main_right_h">
        <h4 class="main_timezone_h">${timezoneString}</h4>
        <h4 class="main_coords_h">${lat}N ${lon}E</h4>
    </div>
  </div>`;
  },
  createTimeContainer: (data) => {
    return `<div class="time_container">
      <span class="time mt-4">${data.hour}:${data.minutes}</span>
      <span class="time_am_pm">${data.am_pm}</span>
      </div>`;
  },
  createDateAndInfo: (data, currentWeatherData) => {
    return `
    <div class="col-sm-5 mb-5 date_info">
    <div class="main_left_date">
    <img class="main_cloud_icon" src='http://openweathermap.org/img/wn/${currentWeatherData.icon}@2x.png' alt="Weather Icon">
    <h4 class="date mt-4">${currentWeatherData.country}, ${currentWeatherData.dayOfWeek}, ${currentWeatherData.month} ${currentWeatherData.day}, ${currentWeatherData.year
    }, ${currentWeatherData.hour}:${currentWeatherData.minutes}${currentWeatherData.am_pm}</h4>
    </div>
    <p class="main_left_text">
    ${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)} with a temperature of ${data.main.temp}°C and it feels like ${data.main.feels_like}°C. The wind speed is ${data.wind.speed} m/s from ${data.wind.deg} degrees, and clouds are covering ${data.clouds.all}% of the sky.
    </p>
    </div>
  `;
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
      weatherSummary = `The current weather in ${location}, ${country} is cloudy with a temperature of ${main.temp}°C and a humidity level of ${main.humidity}%. Although it's not sunny, it's still can be a comfortable day to be outside.`;
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
      weatherId: data.weather[0].id,
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
        background = "/assets/rainy_night.mp4";
      } else {
        background = "/assets/clear-skies-night.mp4";
      }
      // day cases:
    } else if (weather.weatherId >= 200 && weather.weatherId < 300) {
      // If it is not night time and there is thunderstorm
      background = "/assets/thunderstorm.mp4";
    } else if (weather.weatherId >= 500 && weather.weatherId < 600) {
      // If it is not night time and there is rain
      background = "/assets/rainy_skies_day.mp4";
    } else if (weather.clouds.all >= 50) {
      // If it is not night time and there is no precipitation, but the cloud cover is greater than 50%
      background = "/assets/cloudy_skies.mp4";
    }
    return background;
  },
  showForecastWeather: (response) => {
    let content = "";
    response.data.map((day, index) => {
      let datetime = day.datetime;
      let date = new Date(datetime);
      let days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat",];
      let dayInString = days[date.getUTCDay()];
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
    const arrow = document.createElement("div");
    arrow.innerHTML = `<i class="arrow left"></i>`;
    document.querySelector(".wether_forecast").prepend(arrow);
  },
  displayForecastGraph: (response, graphId) => {
    let graphData = [];
    const currentDate = new Date().toLocaleDateString();
    response.list.map((day) => {
      const dayDate = new Date(day.dt_txt).toLocaleDateString();
      if (dayDate === currentDate) {
        graphData.push({ x: day.dt_txt.substring(11, 16), y: day.main.temp });
      }
    });
    let ctx = document.getElementById(graphId).getContext("2d");
    let chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: graphData.map((day) => day.x),
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
          xAxes: [{
            ticks: {
              fontColor: '#c6c6c6'
            }
          }],
          yAxes: [{
            ticks: {
              fontColor: 'white'
            }
          }],
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
      app.fetchCurrentWeather(position).then((data) => {
          app.displayBackground(data);
          app.displayCurrentWeather(data);
          app.createMainInfo(data);
          app.getWeatherSummary(data);
      })
        .catch((err) => {
          console.log(err);
      });
      app.fetchHourlyForecast(position).then((data) => {
          app.displayForecastGraph(data, "forecastGraph");
      })
        .catch((error)=>{
         console.log(error);
      })
      app.fetchForecastData(position).then((data) => {
          app.showForecastWeather(data);
      })
        .catch((error) => {
          console.error(error);
      });
    } else {
      console.error(error);
    }
  },
};
app.inite();
