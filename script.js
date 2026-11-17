import {getWeather} from './weather.js';
import {setupCitySearch} from './autocomplete.js';
const $=s=>document.querySelector(s);
const citySearch=setupCitySearch({
  input: $('#city-input'),
  results: $('#results'),
  getKey: () => key,
  onSelect: load,
});
let key='';try{key=sessionStorage.getItem('weather-key')||'';}catch{}
let unit='C',weather,lastCity={name:'Cairo',country:'Egypt',lat:30.0444,lon:31.2357},controller,lastAction=()=>load(lastCity);
const temperature=value=>`${Math.round(unit==='F'?value*9/5+32:value)}\u00b0`;
const icons={sun:'<circle cx="32" cy="32" r="13" fill="#f6cc67" stroke="none"/><path d="M32 5v7m0 40v7M5 32h7m40 0h7M13 13l5 5m28 28 5 5M13 51l5-5m28-28 5-5"/>',cloud:'<circle cx="40" cy="22" r="13" fill="#f6cc67" stroke="none"/><path d="M16 47h33a10 10 0 0 0 0-20 15 15 0 0 0-28-4 12 12 0 0 0-5 24Z" fill="#d9e7f2" stroke="none"/>',rain:'<path d="M14 38h36a10 10 0 0 0-2-20 15 15 0 0 0-28 2 9 9 0 0 0-6 18Z" fill="#c8d9ec" stroke="none"/><path d="m20 45-3 8m16-8-3 8m16-8-3 8" stroke="#8cbcff"/>',snow:'<path d="M32 8v48M11 20l42 24M11 44l42-24m-27-5 6 6 6-6m-12 34 6-6 6 6" stroke="#c4e7ff"/>',fog:'<path d="M12 22h40M8 32h48M15 42h34" stroke="#bdc9d7"/>',storm:'<path d="M14 36h36a10 10 0 0 0-2-20 15 15 0 0 0-28 2 9 9 0 0 0-6 18Z" fill="#b2c6df" stroke="none"/><path d="m33 31-9 15h9l-4 13 15-20H33Z" fill="#f6cc67" stroke="none"/>',moon:'<path d="M45 44A23 23 0 0 1 24 9a23 23 0 1 0 30 30Z" fill="#e4eab1" stroke="none"/>'};
function icon(type){return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="#f6cc67" stroke-width="3" stroke-linecap="round">${icons[type]||icons.cloud}</svg>`;}
function start(message){controller?.abort();controller=new AbortController();$('#error').hidden=true;$('#results').hidden=true;$('#status').hidden=false;$('#status').innerHTML='<span class="spinner"></span>';$('#status').append(document.createTextNode(message));$('#dashboard').setAttribute('aria-busy','true');return controller.signal;}
function finish(signal){if(signal!==controller.signal)return;$('#status').hidden=true;$('#dashboard').setAttribute('aria-busy','false');}
function fail(error,signal){if(signal.aborted)return;$('#error-text').textContent=error instanceof TypeError?'Unable to connect. Check your internet connection and try again.':error.message;$('#error').hidden=false;}
async function load(city){citySearch.close();lastAction=()=>load(city);const signal=start('Getting the latest weather…');try{const data=await getWeather(city,key,signal);if(signal.aborted)return;weather=data;lastCity=city;render();}catch(e){fail(e,signal);}finally{finish(signal);}}
function search(query){return citySearch.search(query);}
function renderBase(){const w=weather;$('#empty').hidden=true;$('#dashboard').hidden=false;$('#city-name').textContent=`${w.city.name}${w.city.country?', '+w.city.country:''}`;$('#local-date').textContent=new Date(w.date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});$('#temperature').textContent=temperature(w.temp);$('#condition').textContent=w.label;$('#main-icon').innerHTML=icon(w.type);$('#feels-like').textContent=`Feels like ${temperature(w.feels)}`;$('#high-low').textContent=`↑ ${temperature(w.high)}  ↓ ${temperature(w.low)}`;
const metrics=[['◉','Humidity',w.humidity,'%', 'Relative humidity'],['≋','Wind speed',Math.round(w.wind),'km/h','At your location'],['◎','Visibility',w.visibility.toFixed(1),'km','How far you can see'],['◴','Pressure',Math.round(w.pressure),'hPa',w.provider==='Open-Meteo'?'Surface pressure':'Sea-level pressure']];
$('#metrics').innerHTML=metrics.map(([symbol,title,value,units,caption])=>`<article class="metric"><div class="metric-title"><span>${title}</span><span class="metric-symbol">${symbol}</span></div><p class="metric-value">${value}<span>${units}</span></p><p class="metric-caption">${caption}</p>${title==='Humidity'?`<div class="meter"><i style="width:${value}%"></i></div>`:''}</article>`).join('');
$('#forecast').innerHTML=w.days.map((d,i)=>`<article class="forecast-card"><p class="forecast-day">${i===0?'Tomorrow':new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'})}</p><p class="forecast-date">${new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>${icon(d.type)}<p class="forecast-temp">${temperature(d.high)} <span>${temperature(d.low)}</span></p><p class="forecast-condition">${d.label}</p><div class="rain-chance">♧ <span>${d.rain ?? '—'}% rain</span></div></article>`).join('');
$('#weather-note').textContent=['rain','storm'].includes(w.type)?'A little preparation goes a long way. Keep an umbrella close and check the forecast before heading out.':w.type==='snow'?'Layers on, plans ready. Check the forecast before you head outside.':'Make a little room for the outdoors. Check the forecast and find your moment.';
$('#source').textContent=`${w.provider} · Updated ${w.date.slice(11,16)} local time`;document.querySelectorAll('[data-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===unit)));}
$('#search-form').onsubmit=e=>{e.preventDefault();const query=$('#city-input').value.trim();if(query.length>=2)search(query);};
document.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>{$('#city-input').value=b.dataset.city;search(b.dataset.city);});
document.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{unit=b.dataset.unit;if(weather)render();else document.querySelectorAll('[data-unit]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.unit===unit)));});
$('#retry').onclick=()=>lastAction();
$('#location-button').onclick=()=>{if(!navigator.geolocation){$('#error-text').textContent='Location is unavailable in this browser. Search for a city instead.';$('#error').hidden=false;return;}const signal=start('Finding your location…');navigator.geolocation.getCurrentPosition(p=>{if(!signal.aborted)load({name:'Your location',lat:p.coords.latitude,lon:p.coords.longitude});},()=>{fail(new Error('Could not access your location. Allow location access or search for a city.'),signal);finish(signal);},{timeout:10000,maximumAge:300000});};
$('#settings-button').onclick=()=>{$('#api-key').value=key;$('#settings').showModal();};$('#close-settings').onclick=()=>$('#settings').close();
$('#settings-form').onsubmit=e=>{e.preventDefault();key=$('#api-key').value.trim();try{if(key)sessionStorage.setItem('weather-key',key);else sessionStorage.removeItem('weather-key');}catch{}$('#settings').close();load(lastCity);};
const heading=document.createElement('p');heading.className='weather-heading';$('#local-date').after(heading);
const sunTimes=document.createElement('div');sunTimes.className='sun-times';$('.current-card').append(sunTimes);
const rainSummary=document.createElement('div');rainSummary.className='rain-summary';$('.details').before(rainSummary);
const particles=document.createElement('div');particles.className='weather-particles';particles.setAttribute('aria-hidden','true');particles.innerHTML=Array.from({length:28},(_,i)=>`<i style="--x:${(i*37)%100}%;--speed:${.8+(i%7)*.2}s;--delay:-${i*.31}s"></i>`).join('');document.body.prepend(particles);

function render(){
 renderBase();
 const w=weather;
 document.body.dataset.weather=w.type;
 document.body.dataset.night=String(w.night);
 heading.textContent=`${w.label} ${temperature(w.temp)}${unit}`;
 $('#local-date').textContent=new Date(w.date).toLocaleDateString('en-US',{weekday:'long'})+', '+w.date.slice(11,16);
 const duration=Number.isFinite(w.daylight)?`${Math.floor(w.daylight/3600)} h ${Math.floor(w.daylight%3600/60)} m`:'--';
 sunTimes.innerHTML='<span title="Sunrise">&#9728; <span class="sunrise"></span></span><span class="daylight"></span><span title="Sunset"><span class="sunset"></span> &#9789;</span>';
 sunTimes.querySelector('.sunrise').textContent=w.sunrise||'--';sunTimes.querySelector('.sunset').textContent=w.sunset||'--';sunTimes.querySelector('.daylight').textContent=duration;
 rainSummary.innerHTML=icon('rain')+'<span>Rain chance: <strong></strong></span>';
 rainSummary.querySelector('strong').textContent=Number.isFinite(w.rain)?`${w.rain}%`:'--';
 rainSummary.title=w.provider==='OpenWeatherMap'?'Probability for the next forecast interval':'Maximum precipitation probability today';
 document.querySelectorAll('.forecast-day').forEach((el,i)=>{el.textContent=i===0?'Tomorrow':new Date(w.days[i].date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'});});
 $('#high-low').textContent=`High ${temperature(w.high)} / Low ${temperature(w.low)}`;
 $('#source').textContent=`${w.provider} | Updated ${w.date.slice(11,16)} local time`;
};

load(lastCity);
