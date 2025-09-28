let weatherResult = null;

async function getWeatherData(stationID) {
    const url = "http://localhost:5001/weather/${stationID}"
    try {
        // get request -- wait for response
        const response = await fetch(url);

        // if bad response, show error
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        const result = await response.json(); // converts response to js object
        console.log("API result keys:", Object.keys(result));

        weatherResult = result[stationID];
        let tempResult = weatherResult["forecast1"];
        console.log("this is tempresult", tempResult)

        // info to display (add as much as wanted)
        const weatherDisplay = {
            day: weatherResult.days[0].dayDate,
            temperature: tempResult.temperature[0] / 10,
            maxTemp: weatherResult.days[0].temperatureMax / 10,
            minTemp: weatherResult.days[0].temperatureMin / 10
        }

        displayData(weatherDisplay)
        console.log(result);

    } catch (error) {
        console.log(error.message);
    }
}

// getWeatherData(stationID)

function displayData(data) {
    //display data here
    const tempDisplay = document.querySelector(".temperature-display")
    tempDisplay.innerHTML = data.temperature
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

        //cityName.innerHTML = searchCities(searchInput)

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
            if (!searchInput) return [];

            // clean up user input

            let filtered = filterData(searchInput)
            if (filtered.length > 0) {
                let cityID = filtered[0].id
                getWeatherData(cityID)
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

        let matches = data.slice(0, 3);
        console.log(matches)

        for (let i = 0; i < suggestionsDisplay.length; i++) {
            // optional chaining: access properties of objects (safe if undefined)
            let selectedCity = matches[i];
            suggestionsDisplay[i].innerHTML = selectedCity?.name || '';

            // for each item, listen to click
        }
    })

    dropdownMenu.addEventListener("click", (event) => {
        // get the item that was clicked inside the div
        let clickedItem = event.target;

        if (clickedItem.classList.contains("dropdown-suggestion")) {
            console.log("clicked a suggestion!")
            const clickedIndex = Array.from(allSuggestions).indexOf(clickedItem);
            let selectedCity = matches[clickedIndex]

            try {
                cityName.innerHTML = selectedCity.name

                getWeatherData(selectedCity.id)

            } catch (error) {
                cityName.innerHTML = "nothing found"
            }
        }
    })

});
