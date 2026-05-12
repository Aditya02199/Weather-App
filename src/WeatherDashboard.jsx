import { useState, useEffect, useCallback } from "react";

const API_KEY = "YOUR_API_KEY";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const weatherIcons = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "🌤️",
  "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

const windDir = (deg) => {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
};

const formatDay = (dt) => {
  const d = new Date(dt * 1000);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dt) => {
  return new Date(dt * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function WeatherDashboard() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("metric");
  const [time, setTime] = useState(new Date());
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);

    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`),
        fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`)
      ]);

      if (!wRes.ok) throw new Error("City not found");

      const wData = await wRes.json();
      const fData = await fRes.json();

      setWeather(wData);

      const daily = {};
      fData.list.forEach((item) => {
        const day = new Date(item.dt * 1000).toDateString();
        if (!daily[day]) daily[day] = [];
        daily[day].push(item);
      });

      setForecast(Object.values(daily).slice(0, 5));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const fetchWeatherByCity = useCallback(async (city) => {
    setLoading(true);
    setError(null);

    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?q=${city}&units=${unit}&appid=${API_KEY}`),
        fetch(`${BASE_URL}/forecast?q=${city}&units=${unit}&appid=${API_KEY}`)
      ]);

      if (!wRes.ok) throw new Error("City not found");

      const wData = await wRes.json();
      const fData = await fRes.json();

      setWeather(wData);

      const daily = {};
      fData.list.forEach((item) => {
        const day = new Date(item.dt * 1000).toDateString();
        if (!daily[day]) daily[day] = [];
        daily[day].push(item);
      });

      setForecast(Object.values(daily).slice(0, 5));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) fetchWeatherByCity(query.trim());
  };

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setError("Location access denied");
        setGeoLoading(false);
      }
    );
  };

  useEffect(() => {
    if (weather) {
      fetchWeatherByCity(weather.name);
    }
  }, [unit]);

  const tempUnit = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";

  const getBg = () => {
    if (!weather) {
      return "linear-gradient(135deg, #0f0c29, #302b63, #24243e)";
    }

    const id = weather.weather[0].id;

    if (id >= 200 && id < 300) {
      return "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)";
    }

    if (id >= 300 && id < 600) {
      return "linear-gradient(135deg, #0f2027, #203a43, #2c5364)";
    }

    if (id >= 600 && id < 700) {
      return "linear-gradient(135deg, #e0eafc, #cfdef3, #a8c0ff)";
    }

    if (id >= 700 && id < 800) {
      return "linear-gradient(135deg, #757F9A, #D7DDE8)";
    }

    if (id === 800) {
      return "linear-gradient(135deg, #1a6dff, #00c2ff, #0075ff)";
    }

    return "linear-gradient(135deg, #485563, #29323c)";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: getBg(),
        color: "#fff",
        padding: "20px",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>🌤 WeatherScope</h1>
            <p>{time.toLocaleString()}</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setUnit("metric")}>°C</button>
            <button onClick={() => setUnit("imperial")}>°F</button>
          </div>
        </div>

        {/* SEARCH */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              flex: 1,
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              style={{
                flex: 1,
                minWidth: "220px",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
              }}
            />

            <button type="submit">Search</button>
          </form>

          <button onClick={handleGeo}>
            {geoLoading ? "Loading..." : "📍 My Location"}
          </button>
        </div>

        {error && <p>{error}</p>}

        {loading && <h2>Loading...</h2>}

        {weather && !loading && (
          <>
            {/* MAIN CARD */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                marginBottom: "24px",
                background: "rgba(255,255,255,0.1)",
                padding: "24px",
                borderRadius: "20px",
              }}
            >
              <div>
                <h2>
                  {weather.name}, {weather.sys.country}
                </h2>

                <div
                  style={{
                    fontSize: "clamp(56px, 12vw, 96px)",
                  }}
                >
                  {Math.round(weather.main.temp)}
                  {tempUnit}
                </div>

                <div
                  style={{
                    fontSize: "clamp(32px, 8vw, 48px)",
                  }}
                >
                  {weatherIcons[weather.weather[0].icon]}
                </div>

                <p>{weather.weather[0].description}</p>
              </div>

              {/* STATS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>💧 {weather.main.humidity}%</div>
                <div>
                  💨 {weather.wind.speed} {speedUnit}
                </div>
                <div>🔵 {weather.main.pressure} hPa</div>
                <div>👁️ {(weather.visibility / 1000).toFixed(1)} km</div>
                <div>🌅 {formatTime(weather.sys.sunrise)}</div>
                <div>🌇 {formatTime(weather.sys.sunset)}</div>
              </div>
            </div>

            {/* FORECAST */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {forecast.map((day, i) => {
                const mid = day[Math.floor(day.length / 2)];

                return (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      padding: "20px",
                      borderRadius: "16px",
                      textAlign: "center",
                    }}
                  >
                    <h4>
                      {i === 0
                        ? "Today"
                        : formatDay(mid.dt)}
                    </h4>

                    <div style={{ fontSize: "32px" }}>
                      {weatherIcons[mid.weather[0].icon]}
                    </div>

                    <p>{mid.weather[0].description}</p>

                    <h3>
                      {Math.round(mid.main.temp)}
                      {tempUnit}
                    </h3>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}