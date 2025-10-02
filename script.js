// ==================== CONSTANTS ====================
const icons = {
    1: { url: "./assets/sun.png", description: "Sonne" },
    2: { url: "./assets/sun_with_wind.png", description: "leicht bewölkt" },
    3: { url: "./assets/sun_with_wind.png", description: "bewölkt" },
    4: { url: "./assets/clouds.png", description: "Wolken" },
    5: { url: "./assets/fog.png", description: "Nebel" },
    6: { url: "./assets/fog.png", description: "Nebel, rutschgefahr" },
    7: { url: "./assets/light_rain.png", description: "leichter Regen" },
    8: { url: "./assets/rain.png", description: "Regen" },
    9: { url: "./assets/strong_rain.png", description: "starker Regen" }
};

// ==================== GLOBAL STATE ====================
let weatherResult = null;

// ==================== MAIN APP ====================
document.addEventListener("DOMContentLoaded", function () {
    // ==================== CONSTANTS ====================

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
        let direction;
        if (0 <= number && number < 22.5 || 337.5 <= number && number < 360) {
            direction = "Norden ⬆️";
        } else if (22.5 <= number && number < 67.5) {
            direction = "Nordosten ↗️";
        } else if (67.5 <= number && number < 112.5) {
            direction = "Osten ➡️";
        } else if (112.5 <= number && number < 157.5) {
            direction = "Südosten ↘️";
        } else if (157.5 <= number && number < 202.5) {
            direction = "Süden ⬇️";
        } else if (202.5 <= number && number < 247.5) {
            direction = "Südwesten ↖️";
        } else if (247.5 <= number && number < 292.5) {
            direction = "Westen ⬅️";
        } else if (292.5 <= number && number < 337.5) {
            direction = "Nordwesten ↙️";
        }
        return direction;
    }

    function getCurrent(arr, startTimestamp) {
        let currentDate = new Date();
        let currentHour = currentDate.getHours();

        let forecastStart = new Date(startTimestamp);
        let forecastStartHour = forecastStart.getHours();

        // If current time is before forecast starts, use index 0
        if (currentHour < forecastStartHour) {
            return arr[0];
        }

        // Otherwise calculate the correct index
        let index = currentHour - forecastStartHour;
        return arr[index];
    }

    function formatDate(date) {
        let parts = date.split("-"); // ["yyyy", "mm", "dd"]
        let formattedDate = `${parseInt(parts[2])}.${parseInt(parts[1])}`; // "dd-mm"

        return formattedDate
    }

    // ==================== WEATHER API FUNCTIONS ====================

    async function getMeasurements(stationID) {
        const url = `https://corsproxy.io/?https://dwd.api.proxy.bund.dev/v30/stationOverviewExtended?stationIds=${stationID}`;
        console.log("Fetching URL:", url);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) throw new Error(`Response Status: ${response.status}`);

            const measurementResult = await response.json();
            const stationData = measurementResult[stationID];

            if (!stationData) throw new Error("No station data found");

            const forecast = stationData.forecast1;
            if (!forecast) throw new Error("No forecast1 data found");

            const measurements = {
                start: forecast.start,
                DWDTemp: forecast.temperature
            };

            console.log("Weather Display:", measurements);
            return measurements

        } catch (error) {
            console.log("Error:", error.message);
        }
    }

    async function getWeatherData(stationID) {
        const url = `https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/forecast_mosmix_${stationID}.json`;
        console.log("Fetching URL:", url);

        try {
            const response = await fetch(url);
            let measurements = await getMeasurements(stationID)
            if (!response.ok) throw new Error(`Response Status: ${response.status}`);

            const result = await response.json();
            weatherResult = result;

            let tempResult = weatherResult.forecast;
            console.log(tempResult)
            if (!tempResult) throw new Error("no forecast data found");

            let dayData = weatherResult.days;
            if (!dayData) throw new Error("no day data");

            const weatherDisplay = {
                day: dayData[0].dayDate,
                tempArray: tempResult.temperature,
                icon: tempResult.icon,
                windDirection: tempResult.windDirection,
                windGust: tempResult.windGust,
                sunrise: dayData[0].sunriseOnThisDay,
                sunset: dayData[0].sunsetOnThisDay,
                start: tempResult.start,

                // dwd api temperature 
                DWDTemp: measurements?.DWDTemp || null,
                DWDStart: measurements?.start || null,

                // forecast for next week
                days: [dayData[0], dayData[1], dayData[2], dayData[3]],
            };

            console.log("timestamp is ", weatherDisplay.sunrise)
            displayData(weatherDisplay);

        } catch (error) {
            console.log(error.message);
        }
    }

    // ==================== DISPLAY FUNCTIONS ====================
    function displayIcon(iconNumber, div) {
        const icon = icons[iconNumber];
        if (icon) {
            console.log("icon is ", icon.url)
            console.log("icon number is ", iconNumber)
            const imgElement = document.createElement("img");

            if (iconNumber === 1) {
                imgElement.classList.add("icon-sun");
            } else if (iconNumber === 2 || iconNumber === 3) {
                imgElement.classList.add("icon-cloud");
            } else if (iconNumber === 4) {
                imgElement.classList.add("icon-cloud");
            } else if (iconNumber === 5 || iconNumber === 6) {
                imgElement.classList.add("icon-fog");
            } else if (iconNumber >= 7 && iconNumber <= 9) {
                imgElement.classList.add("icon-rain");
            }

            imgElement.classList.add("weather-icon");
            imgElement.style.width = "100%";
            imgElement.style.height = "90%";
            imgElement.src = icon.url;
            imgElement.alt = "alt text";
            div.appendChild(imgElement);
        }
    }

    function clearIcon(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        hasIcon = false;
    }

    function displayHourTime(arr, startTimestamp) {
        const displayHours = [9, 12, 15, 18, 21];

        let forecastStart = new Date(startTimestamp);
        let forecastStartHour = forecastStart.getHours();

        displayHours.forEach(hour => {
            const tempElement = document.getElementById(`temp-for-${hour}`);
            const index = hour - forecastStartHour; // e.g. 9am - 0am = [9]

            if (index >= 0 && index < arr.length) {
                const temp = (arr[hour] / 10);
                tempElement.textContent = `${temp}°C`;
            }
        });
    }

    function displayData(data) {
        clearIcon(iconDisplay);

        displayTemperatureChart(data.DWDTemp)

        // temperature display
        const tempDisplay = document.querySelector(".temperature-display");
        let currentTemp

        if (data.DWDTemp) {
            currentTemp = getCurrent(data.DWDTemp, data.DWDStart)
            tempDisplay.innerHTML = `${currentTemp / 10} °C`;
            console.log("this is the dwdtemp ", currentTemp)

            // every 3 hour display
            displayHourTime(data.DWDTemp, data.DWDStart);
        } else {
            currentTemp = getCurrent(data.tempArray, data.start)
            tempDisplay.innerHTML = `${currentTemp / 10} °C`;
            console.log("this is the default temp ", currentTemp)
        }

        // icon display 
        let currentIcon = getCurrent(data.icon, data.start)
        displayIcon(currentIcon, iconDisplay);
        if (icons[currentIcon]) {
            cityWeather.innerHTML = icons[currentIcon].description;
        }

        // wind gust and wind direction display
        const windDirectionDisplay = document.querySelector(".wind-direction-display")
        let currentWindDirection = getCurrent(data.windDirection, data.start);  // Get current hour's value
        let normalizedDirection = normalizeWindDirection(currentWindDirection);  // Normalize it
        let windCompass = windDirectionCompass(normalizedDirection);  // Get compass direction
        windDirectionDisplay.innerHTML = `${normalizedDirection}° (${windCompass})`;

        let currentWindGust = getCurrent(data.windGust, data.start)
        const windGustDisplay = document.querySelector(".wind-gust-display")
        windGustDisplay.innerHTML = `${currentWindGust / 10} km/h`

        // sunrise and sunset display 
        let todaySunriseTime = convertTimestamp(data.sunrise)
        const sunriseDisplay = document.querySelector(".sunrise-display")
        sunriseDisplay.innerHTML = todaySunriseTime

        let todaySunsetTime = convertTimestamp(data.sunset)
        const sunsetDisplay = document.querySelector(".sunset-display")
        sunsetDisplay.innerHTML = todaySunsetTime

        // 4 day forecast display

        const daysToDisplay = [1, 2, 3, 4]
        daysToDisplay.forEach((day, index) => {
            let dayDateDisplay = document.querySelector(`.day-${day}-date`);
            let minTempDisplay = document.querySelector(`.day-${day}-min`);
            let maxTempDisplay = document.querySelector(`.day-${day}-max`);
            let precipDisplay = document.querySelector(`.day-${day}-precip`);
            let iconContainer = document.querySelector(`.day-${day}-icon`);

            let dataForDays = data.days[index]

            console.log("this is data for the days ", dataForDays)

            dayDateDisplay.innerHTML = formatDate(dataForDays.dayDate)
            minTempDisplay.innerHTML = `${dataForDays.temperatureMin / 10} °C /`
            maxTempDisplay.innerHTML = `${dataForDays.temperatureMax / 10} °C`
            precipDisplay.innerHTML = `${dataForDays.precipitation} % ☔︎︎`

            iconContainer.innerHTML = "";
            displayIcon(dataForDays.icon2, iconContainer);

        })
    }

    function displayCityData(city) {
        let cityLabel = city.name

        cityName.innerHTML = cityLabel.charAt(0) + cityLabel.substring(1).toLowerCase() || "nothing found";
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

            searchBar.value = "";
        }
    }

let temperatureChart = null;

    // Chart code here
    function displayTemperatureChart(tempArray) {
        if (temperatureChart) {
            temperatureChart.destroy();
        }

        const ctx = document.getElementById('temperature-chart').getContext('2d')
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(163, 243, 203, 1)'); // Start color
        gradient.addColorStop(1, 'rgba(62, 152, 212, 1)'); // End color

        let temperatures = []
        for (let i = 0; i < 24; i++) {
            temperatures.push({
                hour: i,
                temperature: tempArray[i] / 10
            })
        }
        console.log("this is the array ", temperatures)

        let labels = temperatures.map(t => t.hour)

        // chart dataset
        let chartData = {
            labels: labels,
            datasets: [{
                label: "Temperaturkurve",
                data: temperatures.map(row => row.temperature),
                fill: true,
                backgroundColor: gradient,
                borderColor: "rgba(255, 255, 255, 1)",
                tension: 0.4,
                borderWidth: 2

            }]
        };

        // chart configuration
        const config = {
            type: "line",
            data: chartData,
            options: {
                color: '#ffffffff',
                responsive: true,
                devicePixelRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "24-Stunden-Temperatur",
                        color: '#1a2a35ff'
                    },
                    font: {
                        family: "Arial",
                        size: 24,
                        weight: 'bold',
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffffff',
                            font: {
                                family: "Arial",
                                size: 14,
                            }
                        },
                        title: {
                            display: true,
                            text: "Stunden (24h)",
                            color: '#ffffffff',
                            font: {
                                family: "Arial",
                                size: 14,
                                weight: "bold",
                            }
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffffff',
                            font: {
                                family: "'Verdana', sans-serif",
                                size: 14,
                            }
                        },
                        title: {
                            display: true,
                            text: "Temperatur in °C",
                            color: '#ffffffff',
                            font: {
                                family: "'Verdana', sans-serif",
                                size: 14,
                                weight: "bold",
                            }
                        }
                    }
                }
            }
        }
        temperatureChart = new Chart(
            document.getElementById("temperature-chart"),
            config
        )
    };


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
                let chemnitzLabel = chemnitz.name
                cityName.innerHTML = chemnitzLabel.charAt(0) + chemnitzLabel.substring(1).toLowerCase();
                getWeatherData(chemnitz.id);
            }
        })
        .catch(error => {
            console.error('Failed to load cities.json:', error);
        });
});

// ADD COMMENTS

// IF STATEMENT FOR 
/** 
0–5	    Windstill
5–10	Leichte Brise
10–20	Mäßiger Wind
20–30	Starker Wind
30–40	Sehr starker Wind
40+	    Sturm */
