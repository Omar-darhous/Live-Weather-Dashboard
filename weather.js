export async function request(url, signal) {
  const response = await fetch(url, {signal});
  if (!response.ok) throw new Error(response.status === 401 ? 'Your OpenWeatherMap key is invalid or not active yet. Check it in settings.' : response.status === 429 ? 'Too many requests. Please wait a moment and try again.' : 'The weather service is unavailable. Please try again.');
  return response.json();
}
export async function findCities(query, key, signal) {
  if (key) {
    const data = await request(`https://api.openweathermap.org/geo/1.0/direct?${new URLSearchParams({q:query,limit:5,appid:key})}`,signal);
    return data.map(c=>({name:c.name,region:c.state,country:c.country,lat:c.lat,lon:c.lon}));
  }
  const data = await request(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({name:query,count:5,language:'en',format:'json'})}`,signal);
  return (data.results || []).map(c=>({name:c.name,region:c.admin1,country:c.country,lat:c.latitude,lon:c.longitude}));
}
export function condition(code, openWeather=false, night=false) {
  let type = 'sun', label = 'Clear sky';
  if (openWeather) {
    if(code<300){type='storm';label='Thunderstorms';}
    else if(code<600){type='rain';label='Rainy';}
    else if(code<700){type='snow';label='Snowy';}
    else if(code<800){type='fog';label='Low visibility';}
    else if(code>800){type='cloud';label=code===801?'Partly cloudy':'Cloudy';}
  } else {
    if(code>=95){type='storm';label='Thunderstorms';}
    else if([71,73,75,77,85,86].includes(code)){type='snow';label='Snowy';}
    else if(code>=51){type='rain';label='Rainy';}
    else if(code>=45){type='fog';label='Foggy';}
    else if(code>0){type='cloud';label=code<3?'Partly cloudy':'Overcast';}
  }
  return {type:type==='sun'&&night?'moon':type,label,night};
}
export async function getWeather(city,key,signal) {
  if(key) {
    const params = new URLSearchParams({lat:city.lat,lon:city.lon,appid:key,units:'metric'});
    const [now,future] = await Promise.all([request(`https://api.openweathermap.org/data/2.5/weather?${params}`,signal),request(`https://api.openweathermap.org/data/2.5/forecast?${params}`,signal)]);
    const date = t=>new Date((t+now.timezone)*1000).toISOString();
    const today = date(now.dt).slice(0,10);
    const groups = new Map();
    for(const item of future.list){const day=date(item.dt).slice(0,10);if(day>today){if(!groups.has(day))groups.set(day,[]);groups.get(day).push(item);}}
    const days = [...groups].slice(0,5).map(([day,items])=>{const noon=items.reduce((a,b)=>Math.abs(Number(date(a.dt).slice(11,13))-12)<Math.abs(Number(date(b.dt).slice(11,13))-12)?a:b);return {date:day,high:Math.max(...items.map(i=>i.main.temp_max)),low:Math.min(...items.map(i=>i.main.temp_min)),rain:Math.round(Math.max(...items.map(i=>i.pop||0))*100),...condition(noon.weather[0].id,true)};});
    return {city:{...city,name:city.name || now.name},sunrise:date(now.sys.sunrise).slice(11,16),sunset:date(now.sys.sunset).slice(11,16),daylight:(now.sys.sunset-now.sys.sunrise),rain:Math.round((future.list[0]?.pop||0)*100),temp:now.main.temp,feels:now.main.feels_like,humidity:now.main.humidity,wind:now.wind.speed*3.6,pressure:now.main.pressure,visibility:now.visibility/1000,high:now.main.temp_max,low:now.main.temp_min,date:date(now.dt).slice(0,16),...condition(now.weather[0].id,true,now.weather[0].icon.endsWith('n')),days,provider:'OpenWeatherMap'};
  }
  const params = new URLSearchParams({latitude:city.lat,longitude:city.lon,current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure',hourly:'visibility',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,daylight_duration',timezone:'auto',forecast_days:6});
  const data = await request(`https://api.open-meteo.com/v1/forecast?${params}`,signal);
  const c=data.current,d=data.daily;
  const index=Math.max(0,data.hourly.time.findIndex(t=>t.slice(0,13)===c.time.slice(0,13)));
  return {city,sunrise:d.sunrise[0]?.slice(11,16),sunset:d.sunset[0]?.slice(11,16),daylight:d.daylight_duration[0],rain:d.precipitation_probability_max[0],temp:c.temperature_2m,feels:c.apparent_temperature,humidity:c.relative_humidity_2m,wind:c.wind_speed_10m,pressure:c.surface_pressure,visibility:data.hourly.visibility[index]/1000,high:d.temperature_2m_max[0],low:d.temperature_2m_min[0],date:c.time,...condition(c.weather_code,false,!c.is_day),days:d.time.slice(1,6).map((date,i)=>({date,high:d.temperature_2m_max[i+1],low:d.temperature_2m_min[i+1],rain:d.precipitation_probability_max[i+1],...condition(d.weather_code[i+1])})),provider:'Open-Meteo'};
}
