// script.js
async function getWeather() {
  const apiKey = '2a4234fa5127207fd258e480df0ad2d9'; // keep this server-side in production
  const cityInput = document.getElementById('city');
  const city = cityInput.value.trim();

  if (!city) {
    alert('Please enter a city');
    return;
  }

  // Use metric units to avoid manual Kelvin→C conversion
  const q = encodeURIComponent(city);
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&appid=${apiKey}&units=metric`;

  try {
    // Fetch both in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    // Fetch won't throw on HTTP errors; check .ok
    if (!currentRes.ok) {
      // try to get JSON error body; fallback to status text
      let errMsg = `Current weather error (${currentRes.status})`;
      try {
        const e = await currentRes.json();
        if (e?.message) errMsg = e.message;
      } catch {}
      throw new Error(errMsg);
    }

    if (!forecastRes.ok) {
      let errMsg = `Forecast error (${forecastRes.status})`;
      try {
        const e = await forecastRes.json();
        if (e?.message) errMsg = e.message;
      } catch {}
      throw new Error(errMsg);
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    displayWeather(currentData);
    displayHourlyForecast(forecastData);
  } catch (error) {
    console.error('Error retrieving weather:', error);
    alert(`Error: ${error.message || 'Failed to fetch weather data.'}`);
  }
}

function displayWeather(data) {
  // Get DOM elements FIRST (your previous code used them before declaration)
  const tempDivInfo = document.getElementById('temp-div');
  const weatherInfoDiv = document.getElementById('weather-info');
  const weatherIcon = document.getElementById('weather-icon');
  const hourlyForecastDiv = document.getElementById('hourly-forecast');

  // Clear previous content
  tempDivInfo.textContent = '';
  weatherInfoDiv.textContent = '';
  hourlyForecastDiv.textContent = '';
  weatherIcon.style.display = 'none';
  weatherIcon.removeAttribute('src');
  weatherIcon.removeAttribute('alt');

  // OpenWeather sometimes sets cod as number or string; normalize
  const cod = String(data.cod ?? '200');
  if (cod !== '200') {
    weatherInfoDiv.innerHTML = `<p>${data.message || 'City not found.'}</p>`;
    return;
  }

  const cityName = data.name;
  const temperature = Math.round(data.main.temp); // already in °C due to &units=metric
  const description = data.weather?.[0]?.description ?? '';
  const iconCode = data.weather?.[0]?.icon ?? '01d';
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  tempDivInfo.innerHTML = `<p>${temperature}°C</p>`;
  weatherInfoDiv.innerHTML = `
    <p>${cityName}</p>
    <p>${description}</p>
  `;

  weatherIcon.src = iconUrl;
  weatherIcon.alt = description;
  weatherIcon.style.display = 'block';
}

function displayHourlyForecast(forecastData) {
  const hourlyForecastDiv = document.getElementById('hourly-forecast');

  const cod = String(forecastData.cod ?? '200');
  if (cod !== '200' || !Array.isArray(forecastData.list)) {
    hourlyForecastDiv.innerHTML = `<p>${forecastData.message || 'No forecast data available.'}</p>`;
    return;
  }

  // 3-hourly steps; next 24h ≈ 8 entries
  const next24Hours = forecastData.list.slice(0, 8);
  const tzOffsetSec = forecastData.city?.timezone ?? 0;

  hourlyForecastDiv.innerHTML = next24Hours
    .map(item => {
      const dateTime = new Date((item.dt + tzOffsetSec) * 1000); // local time using city tz offset
      const hour = String(dateTime.getUTCHours()).padStart(2, '0');
      const temperature = Math.round(item.main.temp);
      const iconCode = item.weather?.[0]?.icon ?? '01d';
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

      return `
        <div class="hourly-item">
          <span>${hour}:00</span>
          <img src="${iconUrl}" alt="Hourly Weather Icon">
          <span>${temperature}°C</span>
        </div>
      `;
    })
    .join('');
}

// Optional: allow Enter key to trigger search
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('city');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') getWeather();
  });
});
  
