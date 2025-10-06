const apiURL = 'https://restcountries.com/v3.1';
const map = L.map('map').setView([20, 0], 2);
let countriesData = [];
let markers = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function loadCountriesOnMap() {
    try {
        const res = await fetch(`${apiURL}/all`);
        countriesData = await res.json();
        populateFilters();
        populateDropdown(countriesData);

        countriesData.forEach(country => {
            if(country.latlng){
                const marker = L.marker(country.latlng).addTo(map)
                    .bindPopup(country.name.common)
                    .on('click', () => showCountryDetails(country));
                markers.push({ country, marker });
            }
        });
    } catch (err) {
        console.error(err);
    }
}

// Dropdown autocomplete
const searchBox = document.getElementById("search");
const countryDropdown = document.getElementById("country-dropdown");

function populateDropdown(countries) {
    countryDropdown.innerHTML = "";
    countries.forEach(c => {
        const li = document.createElement("li");
        li.textContent = c.name.common;
        li.onclick = () => { searchBox.value = c.name.common; searchCountries(); countryDropdown.style.display = "none"; };
        countryDropdown.appendChild(li);
    });
}

searchBox.addEventListener("input", () => {
    const query = searchBox.value.toLowerCase();
    if(query){
        const matches = countriesData.filter(c => c.name.common.toLowerCase().includes(query));
        populateDropdown(matches);
        countryDropdown.style.display = matches.length ? "block" : "none";
    } else countryDropdown.style.display = "none";
});

document.addEventListener("click", e => {
    if(!searchBox.contains(e.target) && !countryDropdown.contains(e.target))
        countryDropdown.style.display = "none";
});

// Filters
function populateFilters() {
    const languageSet = new Set();
    const regionSet = new Set();
    countriesData.forEach(c => {
        if(c.languages) Object.values(c.languages).forEach(l => languageSet.add(l));
        if(c.region) regionSet.add(c.region);
    });

    const langSelect = document.getElementById("language-filter");
    const regionSelect = document.getElementById("region-filter");
    languageSet.forEach(l => { const opt = document.createElement("option"); opt.value = l; opt.textContent = l; langSelect.appendChild(opt); });
    regionSet.forEach(r => { const opt = document.createElement("option"); opt.value = r; opt.textContent = r; regionSelect.appendChild(opt); });
}

document.getElementById("language-filter").addEventListener("change", filterCountries);
document.getElementById("region-filter").addEventListener("change", filterCountries);

function filterCountries() {
    const lang = document.getElementById("language-filter").value;
    const region = document.getElementById("region-filter").value;

    markers.forEach(m => map.removeLayer(m.marker));
    markers = [];

    countriesData.forEach(c => {
        const langMatch = lang ? Object.values(c.languages||{}).includes(lang) : true;
        const regionMatch = region ? c.region === region : true;
        if(langMatch && regionMatch && c.latlng){
            const marker = L.marker(c.latlng).addTo(map).bindPopup(c.name.common).on('click', () => showCountryDetails(c));
            markers.push({ country: c, marker });
        }
    });
}

// Country details & favorites
function showCountryDetails(c) {
    const details = document.getElementById("details-content");
    details.innerHTML = `
        <h3>${c.name.common}</h3>
        <p><strong>Capital:</strong> ${c.capital ? c.capital[0] : 'N/A'}</p>
        <p><strong>Region:</strong> ${c.region}</p>
        <p><strong>Population:</strong> ${c.population.toLocaleString()}</p>
        <p><strong>Area:</strong> ${c.area ? c.area.toLocaleString()+' km²' : 'N/A'}</p>
        <p><strong>Languages:</strong> ${c.languages ? Object.values(c.languages).join(', ') : 'N/A'}</p>
        <img src="${c.flags.svg}" alt="Flag" style="width:100px; border:1px solid #ccc"/>
    `;

    const favs = getFavoriteCountries();
    const addBtn = document.getElementById("add-favorite-button");
    const removeBtn = document.getElementById("remove-favorite-button");

    if(favs.includes(c.name.common)){
        addBtn.style.display = 'none'; removeBtn.style.display = 'block';
    } else { addBtn.style.display = 'block'; removeBtn.style.display = 'none'; }

    addBtn.onclick = () => addToFavorites(c.name.common);
    removeBtn.onclick = () => removeFromFavorites(c.name.common);
}

function getFavoriteCountries(){ return JSON.parse(localStorage.getItem('favorites')||'[]'); }

function addToFavorites(name){
    const favs = getFavoriteCountries();
    if(!favs.includes(name)){
        if(favs.length < 5){
            favs.push(name); localStorage.setItem('favorites', JSON.stringify(favs));
            displayFavorites();
            showCountryDetails(countriesData.find(c=>c.name.common===name));
        } else alert("Max 5 favorites allowed.");
    }
}

function removeFromFavorites(name){
    let favs = getFavoriteCountries();
    favs = favs.filter(n=>n!==name);
    localStorage.setItem('favorites', JSON.stringify(favs));
    displayFavorites();
    showCountryDetails(countriesData.find(c=>c.name.common===name));
}

function displayFavorites(){
    const ul = document.getElementById("favorites-list");
    ul.innerHTML = '';
    getFavoriteCountries().forEach(name=>{
        const li = document.createElement("li"); li.textContent=name;
        const btn = document.createElement("button"); btn.textContent="Remove"; btn.onclick=()=>removeFromFavorites(name);
        li.appendChild(btn); ul.appendChild(li);
    });
}

// Search button
document.getElementById("search-button").onclick = searchCountries;

function searchCountries(){
    const query = searchBox.value.toLowerCase();
    const c = countriesData.find(c=>c.name.common.toLowerCase()===query);
    if(c && c.latlng){
        markers.forEach(m=>map.removeLayer(m.marker));
        markers = [];
        const marker = L.marker(c.latlng).addTo(map).bindPopup(c.name.common).openPopup();
        markers.push({country:c, marker});
        map.setView(c.latlng,5);
        showCountryDetails(c);
    } else alert("Country not found.");
}

// Initial load
loadCountriesOnMap();
displayFavorites();
