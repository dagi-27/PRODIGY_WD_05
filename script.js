

const API_KEY = '81d7b6884a19f372129f653f029b0637'; // Replace with your OpenWeatherMap API key
let debounceTimer;

document.getElementById('cityInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if(e.target.value.length >= 2) {
            showLoading(true);
            fetchSuggestions(e.target.value);
        }
    }, 300);
});

async function fetchSuggestions(query) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
        );
        const data = await response.json();
        showSuggestions(data);
    } catch (error) {
        showError('Failed to fetch suggestions');
    } finally {
        showLoading(false);
    }
}

function showSuggestions(suggestions) {
    const container = document.getElementById('suggestions');
    container.innerHTML = '';
    
    if(suggestions.length === 0) {
        container.style.display = 'none';
        return;
    }

    suggestions.forEach(city => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `${city.name}, ${city.country}`;
        div.onclick = () => selectCity(city);
        container.appendChild(div);
    });
    
    container.style.display = 'block';
}

function selectCity(city) {
    document.getElementById('cityInput').value = `${city.name}, ${city.country}`;
    document.getElementById('suggestions').style.display = 'none';
    fetchWeatherData(city.lat, city.lon);
}

async function fetchWeatherData(lat, lon) {
    showLoading(true);
    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
        ]);
        
        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();
        
        updateWeatherUI(weatherData, forecastData);
    } catch (error) {
        showError('Failed to fetch weather data');
    } finally {
        showLoading(false);
    }
}

function updateWeatherUI(weatherData, forecastData) {
    // Update current weather
    document.getElementById('cityName').textContent = 
        `${weatherData.name}, ${weatherData.sys.country}`;
    document.getElementById('temperature').textContent = 
        Math.round(weatherData.main.temp);
    document.getElementById('weatherDescription').textContent = 
        weatherData.weather[0].description;
    document.getElementById('humidity').textContent = 
        `${weatherData.main.humidity}%`;
    document.getElementById('windSpeed').textContent = 
        `${weatherData.wind.speed} m/s`;
    document.getElementById('feelsLike').textContent = 
        `${Math.round(weatherData.main.feels_like)}°C`;
    document.getElementById('visibility').textContent = 
        `${(weatherData.visibility/1000).toFixed(1)} km`;
    
    const iconCode = weatherData.weather[0].icon;
    document.getElementById('weatherIcon').src = 
        `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    // Update forecast
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';
    for(let i = 0; i < forecastData.list.length; i += 8) {
        const forecast = forecastData.list[i];
        const date = new Date(forecast.dt * 1000);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <h4>${date.toLocaleDateString('en', {weekday: 'short'})}</h4>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" 
                 class="weather-icon" style="width: 60px; height: 60px">
            <div class="temp">${Math.round(forecast.main.temp)}°C</div>
            <div>${forecast.weather[0].main}</div>
        `;
        forecastContainer.appendChild(card);
    }

    // Animate weather card
    const weatherCard = document.getElementById('weatherCard');
    weatherCard.style.animation = 'none';
    setTimeout(() => {
        weatherCard.style.animation = 'fadeIn 1s ease-out';
    }, 10);
}

function getLocation() {
    if(navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            position => fetchWeatherData(
                position.coords.latitude, 
                position.coords.longitude
            ),
            error => showError('Please enable location access')
        );
    } else {
        showError('Geolocation not supported');
    }
}

function showLoading(show) {
    document.querySelector('.loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    alert(message);
    showLoading(false);
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-container')) {
        document.getElementById('suggestions').style.display = 'none';
    }
});

// Initial load
getLocation();
