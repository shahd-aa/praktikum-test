let weatherResult = null;
const icons = {
    1: {
        url: "https://i.imgur.com/gBCEmCB.png",
        description: "Sonne"
    },
    2: {
        url: "https://i.imgur.com/YBYf4Nl.png",
        description: "leicht bewölkt"
    },
    3: {
        url: "https://i.imgur.com/YBYf4Nl.png",
        description: "bewölkt"
    },
    4: {
        url: "https://i.imgur.com/IX8JcKn.png",
        description: "Wolken"
    }
};



async function getWeatherData(stationID, stationNumber) {
    const url = `https://corsproxy.io/?https://dwd.api.proxy.bund.dev/v30/stationOverviewExtended?stationIds=${stationID},${stationNumber}`
    console.log("Fetching URL:", url);
    try {
        // get request -- wait for response
        const response = await fetch(url);

        // if bad response, show error
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        const result = await response.json(); // converts response to js object

        weatherResult = result

        let tempResult = weatherResult[stationNumber]?.forecast1;
        if (!tempResult) {
            throw new Error("no forecast data found")
        }

        let dayData = weatherResult[stationNumber]?.days[0];
        if (!dayData) {
            throw new Error("no day data")
        }

        console.log("this is day data", dayData)
        console.log("this is tempresult", tempResult)

        // info to display (add as much as wanted)
        let temperature = tempResult.temperature

        const weatherDisplay = {
            day: dayData.dayDate,
            currentTemp: temperature[0] / 10,
            maxTemp: dayData.temperatureMax / 10,
            minTemp: dayData.temperatureMin / 10,
            tempArray: temperature,
            icon: dayData.icon
        }

        displayData(weatherDisplay)
        console.log(weatherDisplay);

    } catch (error) {
        console.log(error.message);
    }
}

let hasIcon = false

function displayIcon(iconNumber) {
    if (!hasIcon) {
        hasIcon = true
        const iconDisplay = document.querySelector(".current-weather-icon")

        let icon = icons[iconNumber]
        console.log("icon number: ", icon)

        //let iconNumberAPI = parseInt(data.icon)
        if (icon) {
            const imgElement = document.createElement("img");
            imgElement.style.width = "110px";
            imgElement.style.height = "100px";
            imgElement.src = icon.url
            iconDisplay.appendChild(imgElement)
        }
        else {
            hasIcon = false
            // show default icon ? 
        }
    }
}

function displayHourTime(arr) {
    const displayHours = [9, 12, 18, 21];

    displayHours.forEach(hour => {
        const tempElement = document.getElementById(`temp-for-${hour}`)
        const temp = (arr[hour] / 10).toFixed(0);
        tempElement.textContent = `${temp}°C`;
    })
}

function displayData(data) {
    //display data here
    const tempDisplay = document.querySelector(".temperature-display")

    // temperature display
    tempDisplay.innerHTML = `${data.currentTemp} °C`

    // icon display
    let iconPath = data.icon
    console.log("icon path:", iconPath)
    displayIcon(iconPath)

    // display hours 
    displayHourTime(data.tempArray)

    console.log(data)
}


let citiesData = [];

// fetch cities.json
fetch('./cities.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(cities => {
        citiesData = cities;
        console.log('Loaded cities:', cities);

        // Now you can use the cities array in your app as needed
    })
    .catch(error => {
        console.error('Failed to load cities.json:', error);
    });

document.addEventListener("DOMContentLoaded", function () {

    // ELEMENTS
    const searchBar = document.getElementById("search-bar")
    const dropdownMenu = document.getElementById("dropdown-menu")
    const cityName = document.querySelector("h1");

    // FUNCTIONS
    function getInput(element) {
        let input = element.value.trim();
        return input
    }

    function filterData(input) {
        let cityFound = citiesData.filter(city =>
            city.name.toLowerCase().startsWith(input.toLowerCase())
        )
        return cityFound
    }

    function toggleVisibility(element) {
        element.classList.remove("hidden")
    }

    function removeVisibility(element) {
        element.classList.add("hidden")
    }

    // listen for user input
    searchBar.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            let searchInput = getInput(searchBar)
            if (!searchInput) return;

            // filters based off of input, checks if at least 1 city was found
            let filtered = filterData(searchInput)
            console.log(`this is filtered: ${filtered}`)
            if (filtered.length > 0) {
                let cityID = filtered[0].id
                let cityNumber = filtered[0].kennung
                // api needs id, not city name
                getWeatherData(cityID, cityNumber)
                removeVisibility(dropdownMenu)
            }
            else {
                console.log("error! no cities match")
                // CHANGE THIS TO SHOW NO MATCH ON DROPDOWN MENU
            }
        }
    });

    // EVENT LISTENERS
    searchBar.addEventListener("focus", function () {
        toggleVisibility(dropdownMenu)
    })

    searchBar.addEventListener("blur", function () {
        setTimeout(() => removeVisibility(dropdownMenu), 200)
    })


    let matches = []
    const suggestionsDisplay = Array.from(document.querySelectorAll(".dropdown-suggestion"));

    searchBar.addEventListener("input", () => {
        let input = getInput(searchBar)
        let data = filterData(input)

        matches = data.slice(0, 3);
        console.log(matches)

        // for every suggestion div, get the city match based off of index
        for (let i = 0; i < suggestionsDisplay.length; i++) {
            let selectedCity = matches[i];
            // optional chaining: access properties of objects (safe if undefined)
            suggestionsDisplay[i].innerHTML = selectedCity?.name || '';
        }
    })

    function displayCityData(city) {
        try {
            cityName.innerHTML = city.name
        }
        catch {
            cityName.innerHTML = "nothing found"
        }
    }

    dropdownMenu.addEventListener("click", (event) => {
        // get the item that was clicked inside the div
        let clickedItem = event.target;

        if (clickedItem.classList.contains("dropdown-suggestion")) {
            console.log("clicked a suggestion!")
            // get the index of the 1 suggestion out of 3 that was clicked 
            const clickedIndex = Array.from(suggestionsDisplay).indexOf(clickedItem);
            // match the city with the index
            let selectedCity = matches[clickedIndex]

            displayCityData(selectedCity)

            getWeatherData(selectedCity.id, selectedCity.kennung)
            // clear searchbar value after user clicked
            searchBar.value = ""
        }
    })
});
