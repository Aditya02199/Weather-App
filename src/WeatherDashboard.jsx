import { useState, useEffect, useCallback } from "react";

const API_KEY = "94e7f1c03a6b5b5896d46f917c774eff"; // Replace with your key from openweathermap.org
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
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (dt) => {
  return new Date(dt * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchWeatherByCoords = useCallback(async (lat, lon) => {
    setLoading(true); setError(null);
    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`),
        fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`)
      ]);
      if (!wRes.ok) throw new Error("City not found. Check your API key or city name.");
      const wData = await wRes.json();
      const fData = await fRes.json();
      setWeather(wData);
      const daily = {};
      fData.list.forEach(item => {
        const day = new Date(item.dt * 1000).toDateString();
        if (!daily[day]) daily[day] = [];
        daily[day].push(item);
      });
      setForecast(Object.values(daily).slice(0, 5));
      setAnimKey(k => k + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const fetchWeatherByCity = useCallback(async (city) => {
    setLoading(true); setError(null);
    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?q=${city}&units=${unit}&appid=${API_KEY}`),
        fetch(`${BASE_URL}/forecast?q=${city}&units=${unit}&appid=${API_KEY}`)
      ]);
      if (!wRes.ok) throw new Error("City not found. Check your API key or city name.");
      const wData = await wRes.json();
      const fData = await fRes.json();
      setWeather(wData);
      const daily = {};
      fData.list.forEach(item => {
        const day = new Date(item.dt * 1000).toDateString();
        if (!daily[day]) daily[day] = [];
        daily[day].push(item);
      });
      setForecast(Object.values(daily).slice(0, 5));
      setAnimKey(k => k + 1);
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
    if (!navigator.geolocation) return setError("Geolocation not supported.");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude); setGeoLoading(false); },
      () => { setError("Location access denied."); setGeoLoading(false); }
    );
  };

  useEffect(() => {
    if (weather) fetchWeatherByCity(weather.name);
  }, [unit]);

  const tempUnit = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";

  const getBg = () => {
    if (!weather) return "linear-gradient(135deg, #0f0c29, #302b63, #24243e)";
    const id = weather.weather[0].id;
    if (id >= 200 && id < 300) return "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)";
    if (id >= 300 && id < 600) return "linear-gradient(135deg, #0f2027, #203a43, #2c5364)";
    if (id >= 600 && id < 700) return "linear-gradient(135deg, #e0eafc, #cfdef3, #a8c0ff)";
    if (id >= 700 && id < 800) return "linear-gradient(135deg, #757F9A, #D7DDE8)";
    if (id === 800) return "linear-gradient(135deg, #1a6dff, #00c2ff, #0075ff)";
    return "linear-gradient(135deg, #485563, #29323c)";
  };

  const isDay = weather ? (weather.dt > weather.sys.sunrise && weather.dt < weather.sys.sunset) : true;

  return (
    <div style={{
      minHeight: "100vh",
      background: getBg(),
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#fff",
      padding: "0",
      transition: "background 1.5s ease",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
        <div style={{position:"absolute",width:"600px",height:"600px",borderRadius:"50%",background:"rgba(255,255,255,0.03)",top:"-200px",right:"-150px",animation:"float 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:"400px",height:"400px",borderRadius:"50%",background:"rgba(255,255,255,0.04)",bottom:"-100px",left:"-100px",animation:"float 10s ease-in-out infinite reverse"}}/>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .card { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; }
        .forecast-item { transition: transform 0.2s, background 0.2s; }
        .forecast-item:hover { transform: translateY(-4px); background: rgba(255,255,255,0.18) !important; }
        .search-btn:hover { background: rgba(255,255,255,0.35) !important; }
        .unit-btn:hover { background: rgba(255,255,255,0.2) !important; }
        input::placeholder { color: rgba(255,255,255,0.5); }
        input:focus { outline: none; }
      `}</style>

      <div style={{maxWidth:"960px",margin:"0 auto",padding:"32px 20px",position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"32px"}}>
          <div>
            <h1 style={{margin:0,fontSize:"28px",fontWeight:700,letterSpacing:"-0.5px"}}>🌤 WeatherScope</h1>
            <p style={{margin:"4px 0 0",opacity:0.5,fontSize:"13px",fontFamily:"'Space Mono', monospace"}}>
              {time.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · {time.toLocaleTimeString()}
            </p>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            {["metric","imperial"].map(u => (
              <button key={u} onClick={()=>setUnit(u)} className="unit-btn" style={{
                background: unit===u ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:"12px",
                padding:"8px 16px",cursor:"pointer",fontFamily:"'Space Mono',monospace",fontSize:"13px",fontWeight:700
              }}>
                {u==="metric"?"°C":"°F"}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="card" style={{padding:"16px 20px",marginBottom:"28px",display:"flex",gap:"12px",alignItems:"center"}}>
          <form onSubmit={handleSearch} style={{display:"flex",flex:1,gap:"12px"}}>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Search city (e.g. Tokyo, London, Mumbai)..."
              style={{flex:1,background:"transparent",border:"none",color:"#fff",fontSize:"16px",fontFamily:"'DM Sans',sans-serif",padding:"4px 0"}}
            />
            <button type="submit" className="search-btn" style={{
              background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.2)",
              color:"#fff",borderRadius:"12px",padding:"10px 20px",cursor:"pointer",fontWeight:600,fontSize:"15px"
            }}>🔍 Search</button>
          </form>
          <div style={{width:"1px",height:"32px",background:"rgba(255,255,255,0.2)"}}/>
          <button onClick={handleGeo} className="search-btn" style={{
            background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",
            color:"#fff",borderRadius:"12px",padding:"10px 16px",cursor:"pointer",fontSize:"15px"
          }}>
            {geoLoading ? "⏳" : "📍"} My Location
          </button>
        </div>

        {error && (
          <div className="card" style={{padding:"16px 20px",marginBottom:"24px",background:"rgba(255,80,80,0.15)",borderColor:"rgba(255,80,80,0.3)"}}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{textAlign:"center",padding:"60px 0",opacity:0.7}}>
            <div style={{fontSize:"48px",display:"inline-block",animation:"spin 1s linear infinite"}}>🌀</div>
            <p style={{marginTop:"16px",fontFamily:"'Space Mono',monospace",fontSize:"14px"}}>Fetching weather data...</p>
          </div>
        )}

        {weather && !loading && (
          <div>
            {/* Current Weather Card */}
            <div className="card" style={{padding:"36px",marginBottom:"24px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:"-20px",right:"-20px",fontSize:"180px",opacity:0.08,lineHeight:1,pointerEvents:"none"}}>
                {weatherIcons[weather.weather[0].icon]}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"24px",alignItems:"start"}}>
                <div>
                  <div style={{fontSize:"16px",fontWeight:600,opacity:0.7,marginBottom:"8px"}}>{weather.name}, {weather.sys.country}</div>
                  <div style={{display:"flex",alignItems:"flex-start",gap:"16px"}}>
                    <div style={{fontSize:"96px",lineHeight:1.1,fontWeight:300,fontFamily:"'Space Mono',monospace"}}>
                      {Math.round(weather.main.temp)}{tempUnit}
                    </div>
                    <div style={{paddingTop:"16px",fontSize:"48px"}}>{weatherIcons[weather.weather[0].icon]}</div>
                  </div>
                  <div style={{fontSize:"20px",fontWeight:500,opacity:0.85,textTransform:"capitalize"}}>{weather.weather[0].description}</div>
                  <div style={{fontSize:"15px",opacity:0.55,marginTop:"6px"}}>
                    Feels like {Math.round(weather.main.feels_like)}{tempUnit} · H: {Math.round(weather.main.temp_max)}{tempUnit} · L: {Math.round(weather.main.temp_min)}{tempUnit}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",minWidth:"260px"}}>
                  {[
                    {label:"Humidity",value:`${weather.main.humidity}%`,icon:"💧"},
                    {label:"Wind",value:`${weather.wind.speed} ${speedUnit} ${windDir(weather.wind.deg)}`,icon:"💨"},
                    {label:"Pressure",value:`${weather.main.pressure} hPa`,icon:"🔵"},
                    {label:"Visibility",value:`${(weather.visibility/1000).toFixed(1)} km`,icon:"👁️"},
                    {label:"Sunrise",value:formatTime(weather.sys.sunrise),icon:"🌅"},
                    {label:"Sunset",value:formatTime(weather.sys.sunset),icon:"🌇"},
                  ].map(s => (
                    <div key={s.label} style={{background:"rgba(255,255,255,0.08)",borderRadius:"16px",padding:"14px 16px",border:"1px solid rgba(255,255,255,0.1)"}}>
                      <div style={{fontSize:"20px",marginBottom:"4px"}}>{s.icon}</div>
                      <div style={{fontSize:"15px",fontWeight:600}}>{s.value}</div>
                      <div style={{fontSize:"11px",opacity:0.5,marginTop:"2px",fontFamily:"'Space Mono',monospace",textTransform:"uppercase"}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            {forecast && (
              <>
                <h2 style={{fontSize:"14px",fontFamily:"'Space Mono',monospace",opacity:0.5,textTransform:"uppercase",letterSpacing:"2px",marginBottom:"16px",fontWeight:400}}>
                  5-Day Forecast
                </h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"12px",marginBottom:"24px"}}>
                  {forecast.map((day, i) => {
                    const mid = day[Math.floor(day.length/2)];
                    const maxT = Math.max(...day.map(d=>d.main.temp_max));
                    const minT = Math.min(...day.map(d=>d.main.temp_min));
                    return (
                      <div key={i} className="forecast-item card" style={{padding:"20px 16px",textAlign:"center",background:"rgba(255,255,255,0.08)"}}>
                        <div style={{fontSize:"11px",fontFamily:"'Space Mono',monospace",opacity:0.5,textTransform:"uppercase",marginBottom:"12px"}}>
                          {i===0?"Today":formatDay(mid.dt).split(",")[0]}
                        </div>
                        <div style={{fontSize:"36px",marginBottom:"10px"}}>{weatherIcons[mid.weather[0].icon]}</div>
                        <div style={{fontSize:"12px",opacity:0.6,textTransform:"capitalize",marginBottom:"12px"}}>{mid.weather[0].description}</div>
                        <div style={{display:"flex",justifyContent:"center",gap:"8px",fontFamily:"'Space Mono',monospace"}}>
                          <span style={{fontWeight:700,fontSize:"15px"}}>{Math.round(maxT)}{tempUnit}</span>
                          <span style={{opacity:0.4,fontSize:"15px"}}>{Math.round(minT)}{tempUnit}</span>
                        </div>
                        {mid.pop > 0 && <div style={{fontSize:"11px",opacity:0.5,marginTop:"8px"}}>💧 {Math.round(mid.pop*100)}%</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Hourly */}
                <h2 style={{fontSize:"14px",fontFamily:"'Space Mono',monospace",opacity:0.5,textTransform:"uppercase",letterSpacing:"2px",marginBottom:"16px",fontWeight:400}}>
                  Today's Hourly Trend
                </h2>
                <div className="card" style={{padding:"20px 24px",overflowX:"auto"}}>
                  <div style={{display:"flex",gap:"20px",minWidth:"max-content"}}>
                    {(forecast[0]||[]).map((h,i) => (
                      <div key={i} style={{textAlign:"center",minWidth:"60px"}}>
                        <div style={{fontSize:"11px",fontFamily:"'Space Mono',monospace",opacity:0.5,marginBottom:"8px"}}>{formatTime(h.dt)}</div>
                        <div style={{fontSize:"24px",marginBottom:"6px"}}>{weatherIcons[h.weather[0].icon]}</div>
                        <div style={{fontWeight:600,fontSize:"14px"}}>{Math.round(h.main.temp)}{tempUnit}</div>
                        <div style={{fontSize:"10px",opacity:0.4,marginTop:"4px"}}>💧{Math.round(h.pop*100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!weather && !loading && !error && (
          <div style={{textAlign:"center",padding:"80px 40px",opacity:0.6}}>
            <div style={{fontSize:"80px",marginBottom:"20px"}}>🌍</div>
            <h2 style={{fontWeight:500,fontSize:"22px",margin:0}}>Search a city or use your location</h2>
            <p style={{opacity:0.6,marginTop:"8px",fontFamily:"'Space Mono',monospace",fontSize:"13px"}}>Get real-time weather + 5-day forecast</p>
          </div>
        )}
      </div>
    </div>
  );
}