const apiURL = 'https://restcountries.com/v3.1';
const map = L.map('map').setView([20, 0], 2);
let countriesData = [];
let markers = []; // it is Store all markers to manage them

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function loadCountriesOnMap() {
    try {
        const response = await fetch(`${apiURL}/all`);
        countriesData = await response.json();
        populateFilters();

        countriesData.forEach(country => {
            const latlng = country.latlng;
            if (latlng) {
                const marker = L.marker(latlng).addTo(map);
                marker.bindPopup(country.name.common);
                marker.on('click', () => showCountryDetails(country));
                markers.push({ country, marker }); // Store the marker with its country data
            }
        });
    } catch (error) {
        console.error("Error fetching countries:", error);
    }
}

const searchBox = document.getElementById("search");
const countryDropdown = document.getElementById("country-dropdown");

// Populate dropdown with all countries on load
function populateDropdown(countries) {
    countryDropdown.innerHTML = ""; // it is Clear previous options
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.name.common;
        option.textContent = country.name.common;
        countryDropdown.appendChild(option);
    });
}

 // Filter dropdown as user types, filtering by starting letter only
searchBox.addEventListener("input", () => {
    const query = searchBox.value.toLowerCase();
    if (query) {
        // Filter countries by names starting with the query
        const matchingCountries = countriesData.filter(country =>
            country.name.common.toLowerCase().startsWith(query)
        );

        // Populate dropdown with matching countries
        populateDropdown(matchingCountries);
        
        // Display the dropdown if there are matches, otherwise hide it
        countryDropdown.style.display = matchingCountries.length > 0 ? "block" : "none";
    } else {
        // Hide dropdown if search box is empty
        countryDropdown.style.display = "none";
    }
});

// Function to populate dropdown options
function populateDropdown(countries) {
    countryDropdown.innerHTML = ""; // Clear previous options
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.name.common;
        option.textContent = country.name.common;
        countryDropdown.appendChild(option);
    });
}

// Listen for selection in the dropdown
countryDropdown.addEventListener("change", () => {
    searchBox.value = countryDropdown.value; // Update search box with selected value
    searchCountries(); // Trigger search
    countryDropdown.style.display = "none"; // Hide dropdown after selection
});

// Hide dropdown when clicking outside
document.addEventListener("click", (event) => {
    if (!searchBox.contains(event.target) && !countryDropdown.contains(event.target)) {
        countryDropdown.style.display = "none";
    }
});


function populateFilters() {
    const languageSet = new Set();
    const regionSet = new Set();
    
    countriesData.forEach(country => {
        if (country.languages) {
            Object.values(country.languages).forEach(lang => languageSet.add(lang));
        }
        if (country.region) {
            regionSet.add(country.region);
        }
    });

    const languageFilter = document.getElementById("language-filter");
    languageSet.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang;
        languageFilter.appendChild(option);
    });

    const regionFilter = document.getElementById("region-filter");
    regionSet.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
    });
}

function showCountryDetails(country) {
    const detailsContent = document.getElementById("details-content");
    detailsContent.innerHTML = `
        <h3>${country.name.common}</h3>
        <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
        <p><strong>Region:</strong> ${country.region}</p>
        <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
        <p><strong>Area:</strong> ${country.area ? country.area.toLocaleString() + ' km²' : 'N/A'}</p>
        <p><strong>Languages:</strong> ${country.languages ? Object.values(country.languages).join(", ") : 'N/A'}</p>
        <img src="${country.flags.svg}" alt="Flag of ${country.name.common}" style="width: 100px; border: 1px solid #ccc;"/>
    `;

    const favoriteCountries = getFavoriteCountries();
    const addFavoriteButton = document.getElementById("add-favorite-button");
    const removeFavoriteButton = document.getElementById("remove-favorite-button");

    if (favoriteCountries.includes(country.name.common)) {
        addFavoriteButton.style.display = 'none';
        removeFavoriteButton.style.display = 'block';
    } else {
        addFavoriteButton.style.display = 'block';
        removeFavoriteButton.style.display = 'none';
    }

    addFavoriteButton.onclick = () => addToFavorites(country.name.common);
    removeFavoriteButton.onclick = () => removeFromFavorites(country.name.common);
}

function getFavoriteCountries() {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
}

function addToFavorites(countryName) {
    const favorites = getFavoriteCountries();
    if (!favorites.includes(countryName)) {
        if (favorites.length < 5) {
            favorites.push(countryName);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            alert(`${countryName} added to favorites!`);
            displayFavorites();
            showCountryDetails(countriesData.find(country => country.name.common === countryName));
        } else {
            alert("You can only select up to 5 favorite countries.");
        }
    }
}

function removeFromFavorites(countryName) {
    let favorites = getFavoriteCountries();
    favorites = favorites.filter(name => name !== countryName);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert(`${countryName} removed from favorites.`);
    displayFavorites();
    showCountryDetails(countriesData.find(country => country.name.common === countryName));
}

function displayFavorites() {
    const favoritesList = document.getElementById("favorites-list");
    favoritesList.innerHTML = '';
    getFavoriteCountries().forEach(countryName => {
        const li = document.createElement("li");
        li.textContent = countryName;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.onclick = () => removeFromFavorites(countryName);

        li.appendChild(removeButton);
        favoritesList.appendChild(li);
    });
}



document.getElementById("search-button").onclick = () => searchCountries();
document.getElementById("language-filter").onchange = filterCountries;
document.getElementById("region-filter").onchange = filterCountries;

async function searchCountries() {
    const query = document.getElementById("search").value.toLowerCase();
    const result = countriesData.find(country => country.name.common.toLowerCase() === query);

    if (result) {
        // Clear all previous markers
        markers.forEach(({ marker }) => map.removeLayer(marker));

        // Add only the searched country's marker
        const latlng = result.latlng;
        if (latlng) {
            const marker = L.marker(latlng).addTo(map);
            marker.bindPopup(result.name.common).openPopup();
            markers.push({ country: result, marker }); // Store the marker with its country data
            map.setView(latlng, 5);
            showCountryDetails(result);
        }
    } else {
        alert("Country not found.");
    }
}

function filterCountries() {
    const selectedLanguage = document.getElementById("language-filter").value;
    const selectedRegion = document.getElementById("region-filter").value;

    //it's help to Remove all markers from the map
    markers.forEach(({ marker }) => map.removeLayer(marker));

    // Add only the filtered markers that match both filters
    markers.forEach(({ country, marker }) => {
        const matchesLanguage = selectedLanguage ? 
            Object.values(country.languages || {}).includes(selectedLanguage) : true;
        const matchesRegion = selectedRegion ? country.region === selectedRegion : true;

        // If the country matches both the selected language and region, add it to the map
        if (matchesLanguage && matchesRegion) {
            marker.addTo(map);
        }
    });
}

 document.getElementById("language-filter").addEventListener("change", filterCountries);
document.getElementById("region-filter").addEventListener("change", filterCountries);



loadCountriesOnMap();
displayFavorites();
