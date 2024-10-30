// API URL
const apiURL = 'https://restcountries.com/v3.1';

 const map = L.map('map').setView([20, 0], 2);

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let countriesData = [];

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
            }
        });
    } catch (error) {
        console.error("Error fetching countries:", error);
    }
}

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
        favorites.push(countryName);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert(`${countryName} added to favorites!`);
        displayFavorites();
        showCountryDetails(countriesData.find(country => country.name.common === countryName)); // Update details
    }
}

 function removeFromFavorites(countryName) {
    let favorites = getFavoriteCountries();
    favorites = favorites.filter(name => name !== countryName);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert(`${countryName} removed from favorites!`);
    displayFavorites(); // Refresh the favorites display
    showCountryDetails(countriesData.find(country => country.name.common === countryName)); // Update details
}

 function searchCountries() {
    const query = document.getElementById('search').value.toLowerCase();
    const selectedLanguage = document.getElementById('language-filter').value;
    const selectedRegion = document.getElementById('region-filter').value;

    const filteredCountries = countriesData.filter(country => {
        const matchesQuery = country.name.common.toLowerCase().includes(query);
        
         const matchesLanguage = selectedLanguage
            ? Object.values(country.languages || {}).includes(selectedLanguage)
            : true;

         const matchesRegion = selectedRegion ? country.region === selectedRegion : true;

        return matchesQuery && matchesLanguage && matchesRegion;
    });

     map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    filteredCountries.forEach(country => {
        const latlng = country.latlng;
        if (latlng) {
            const marker = L.marker(latlng).addTo(map);
            marker.bindPopup(country.name.common);
            marker.on('click', () => showCountryDetails(country));
        }
    });
}

 document.getElementById('search-button').addEventListener('click', searchCountries);

 document.getElementById('search').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchCountries();
    }
});

 document.getElementById('language-filter').addEventListener('change', function() {
    if (this.value) {
        document.getElementById('region-filter').value = "";
    }
});

document.getElementById('region-filter').addEventListener('change', function() {
    if (this.value) {
        document.getElementById('language-filter').value = "";
    }
});
 function addToFavorites(countryName) {
    const favorites = getFavoriteCountries();
    if (!favorites.includes(countryName)) {
        if (favorites.length < 5) {
            favorites.push(countryName);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            alert(`${countryName} added to favorites!`);
            displayFavorites(); 
            showCountryDetails(countriesData.find(country => country.name.common === countryName)); // Update details
        } else {
            alert("You can only select up to 5 favorite countries.");
        }
    }
}
 function displayFavorites() {
    const favoritesList = document.getElementById("favorites-list");
    favoritesList.innerHTML = ''; 

    const favoriteCountries = getFavoriteCountries();
    favoriteCountries.forEach(countryName => {
        const listItem = document.createElement('li');
        listItem.textContent = countryName;

         const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeFromFavorites(countryName);

        listItem.appendChild(removeButton);
        favoritesList.appendChild(listItem);
    });
}

 loadCountriesOnMap();
displayFavorites(); 
