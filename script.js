// ==================== CONSTANTS ====================
const icons = {
    1: { url: "./assets/sun.png", description: "Sonne" },
    2: { url: "./assets/sun_with_cloud.png", description: "leicht bewölkt" },
    3: { url: "./assets/sun_with_cloud.png", description: "bewölkt" },
    4: { url: "./assets/cloud.png", description: "Wolken" },
    7: { url: "./assets/rain.png", description: "Regen" }
};

// ==================== GLOBAL STATE ====================
let weatherResult = null;

// ==================== MAIN APP ====================
document.addEventListener("DOMContentLoaded", function () {
    let citiesData = [];
    let matches = [];
    let hasIcon = false;

    const searchBar = document.getElementById("search-bar");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const cityName = document.querySelector("h1");
    const cityWeather = document.querySelector("h3");
    const suggestionsDisplay = Array.from(document.querySelectorAll(".dropdown-suggestion"));
    const iconDisplay = document.querySelector(".current-weather-icon");

    // ==================== UTILITY FUNCTIONS ====================
    function getInput(element) {
        return element.value.trim();
    }

    function filterData(input) {
        return citiesData.filter(city =>
            city.name.toLowerCase().startsWith(input.toLowerCase())
        );
    }

    function toggleVisibility(element) {
        element.classList.remove("hidden");
    }

    function removeVisibility(element) {
        element.classList.add("hidden");
    }

    function convertTimestamp(time) {
        let date = new Date(time)
        let hours = date.getHours();
        let minutes = date.getMinutes();

        let formattedMinutes = minutes.toString().padStart(2, '0')
        let timeString = `${hours}:${formattedMinutes}`

        return timeString
    }

    function normalizeWindDirection(degrees) {
        return ((degrees % 360) + 360) % 360;
    }

    function windDirectionCompass(number) {
        let direction
        if (0 < number > 22.5 || 337.5 < number > 360) {
            direction = "Norden"
        } else if (22.5 < number > 67.5) {
            direction = "Nordosten"
        } else if (67.5 < number > 112.5) {
            direction = "Osten"
        } else if (112.5 < number > 157.5) {
            direction = "Südosten"
        } else if (157.5 < number > 202.5) {
            direction = "Süden"
        } else if (202.5 < number > 247.5) {
            direction = "Südwesten"
        } else if (247.5 < number > 292.5) {
            direction = "Westen"
        } else if (292.5 < number > 337.5) {
            direction = "Nordwesten"
        }
    }
    // ==================== WEATHER API FUNCTIONS ====================
    async function getWeatherData(stationID) {
        const url = `https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/forecast_mosmix_${stationID}.json`;
        console.log("Fetching URL:", url);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Response Status: ${response.status}`);

            const result = await response.json();
            weatherResult = result;

            let tempResult = weatherResult.trend;
            if (!tempResult) throw new Error("no forecast data found");

            let dayData = weatherResult.days[0];
            if (!dayData) throw new Error("no day data");

            const weatherDisplay = {
                day: dayData.dayDate,
                currentTemp: tempResult.temperature[0] / 10,
                maxTemp: dayData.temperatureMax / 10,
                minTemp: dayData.temperatureMin / 10,
                tempArray: tempResult.temperature,
                icon: dayData.icon1 || dayData.icon2,
                windDirection: normalizeWindDirection(dayData.windDirection) + "°",
                windGust: dayData.windGust / 10 + " m/s",
                sunrise: convertTimestamp(dayData.sunriseOnThisDay),
                sunset: convertTimestamp(dayData.sunsetOnThisDay)
            };
            //console.log("wind direction is ", weatherDisplay.windDirection) FOR DEBUGGING

            displayData(weatherDisplay);
        } catch (error) {
            console.log(error.message);
        }
    }

    // ==================== DISPLAY FUNCTIONS ====================
    function displayIcon(iconNumber) {
        const icon = icons[iconNumber];
        if (icon) {
            console.log("icon is ", icon.url)
            const imgElement = document.createElement("img");
            imgElement.classList.add("weather-icon");
            imgElement.style.width = "100%";
            imgElement.style.height = "90%";
            imgElement.src = icon.url;
            imgElement.alt = "alt text"
            iconDisplay.appendChild(imgElement);
        }
    }

    function clearIcon(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        hasIcon = false;
    }

    function displayHourTime(arr) {
        const displayHours = [9, 12, 15, 18, 21];
        displayHours.forEach(hour => {
            const tempElement = document.getElementById(`temp-for-${hour}`);
            const temp = (arr[hour] / 10).toFixed(0);
            tempElement.textContent = `${temp}°C`;
        });
    }

    function displayData(data) {
        clearIcon(iconDisplay);

        // temperature display
        const tempDisplay = document.querySelector(".temperature-display");
        tempDisplay.innerHTML = `${data.currentTemp} °C`;

        // icon display 
        displayIcon(data.icon);
        if (icons[data.icon]) {
            cityWeather.innerHTML = icons[data.icon].description;
        }

        // every 3 hour display
        displayHourTime(data.tempArray);

        // wind gust and wind direction display
        const windDirectionDisplay = document.querySelector(".wind-direction-display")
        windDirectionDisplay.innerHTML = data.windDirection

        const windGustDisplay = document.querySelector(".wind-gust-display")
        windGustDisplay.innerHTML = data.windGust

        // sunrise and sunset display 
        const sunriseDisplay = document.querySelector(".sunrise-display")
        sunriseDisplay.innerHTML = data.sunrise

        const sunsetDisplay = document.querySelector(".sunset-display")
        sunsetDisplay.innerHTML = data.sunset
    }

    function displayCityData(city) {
        cityName.innerHTML = city.name || "nothing found";
    }

    function updateSuggestions(input) {
        matches = filterData(input).slice(0, 3);
        suggestionsDisplay.forEach((el, i) => {
            el.innerHTML = matches[i]?.name || '';
        });
    }

    // ==================== EVENT HANDLERS ====================
    function handleSearchEnter(event) {
        if (event.key === "Enter") {
            const searchInput = getInput(searchBar);
            if (!searchInput) return;

            const filtered = filterData(searchInput);
            if (filtered.length > 0) {
                getWeatherData(filtered[0].id);
                removeVisibility(dropdownMenu);
            } else {
                console.log("Error! No cities match");
            }
        }
    }

    function handleDropdownClick(event) {
        const clickedItem = event.target;
        if (clickedItem.classList.contains("dropdown-suggestion")) {
            const clickedIndex = suggestionsDisplay.indexOf(clickedItem);
            const selectedCity = matches[clickedIndex];
            if (!selectedCity) return;

            displayCityData(selectedCity);
            getWeatherData(selectedCity.id);
            clearIcon(iconDisplay);
            searchBar.value = "";
        }
    }

    // ==================== EVENT LISTENERS ====================
    searchBar.addEventListener("keydown", handleSearchEnter);
    searchBar.addEventListener("focus", () => toggleVisibility(dropdownMenu));
    searchBar.addEventListener("blur", () => setTimeout(() => removeVisibility(dropdownMenu), 200));
    searchBar.addEventListener("input", () => updateSuggestions(getInput(searchBar)));
    dropdownMenu.addEventListener("click", handleDropdownClick);

    // ==================== INITIALIZATION ====================
    fetch('./stations_new.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(cities => {
            citiesData = cities;
            const chemnitz = filterData("Chemnitz")[0];
            if (chemnitz) {
                cityName.innerHTML = chemnitz.name;
                getWeatherData(chemnitz.id);
            }
        })
        .catch(error => {
            console.error('Failed to load cities.json:', error);
        });
});

// ADD COMMENTS
// FIND BETTER HIGH QUALITY PICS

// IF STATEMENT FOR 
/** 
0–5	    Windstill
5–10	Leichte Brise
10–20	Mäßiger Wind
20–30	Starker Wind
30–40	Sehr starker Wind
40+	    Sturm */
