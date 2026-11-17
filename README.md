# Atmos — Live Weather Dashboard

A responsive weather dashboard built with HTML, CSS and JavaScript ES modules. Uses Fetch, async/await, city geocoding, live weather and five-day forecasts.

## Run locally

Requires Node.js 18 or newer. No dependencies to install.

```sh
npm run dev
```

Open http://localhost:5173. To check JavaScript syntax: `npm run check`.

## Weather provider

The app starts with **live Open-Meteo data**, requiring no key. To fulfill the OpenWeatherMap integration requirement, create an API key at https://home.openweathermap.org/api_keys, open the settings button, paste the key and save. The app then uses OpenWeatherMap geocoding, current weather and the 5 day / 3 hour forecast API. New keys may need activation time.

The key is stored in sessionStorage, not in the repository. As with any browser-only application, it is visible to the browser user. A production deployment with a private key should use a server-side proxy.

## Features

- City search with a selection list for ambiguous city names, including Arabic search.
- Default Cairo weather and quick links to London, Tokyo and New York.
- Current temperature, condition icons, feels-like temperature, humidity, wind, visibility and pressure.
- Five upcoming local calendar days, high/low temperatures and precipitation probabilities.
- Celsius/Fahrenheit conversion without another network request.
- Geolocation, loading spinner, request cancellation, error messages and retry.
- Responsive layout, semantic HTML, keyboard focus and reduced-motion support.

OpenWeatherMap daily highs/lows summarize available three-hour intervals; the last day can have partial coverage. Current-card highs/lows are the current API's min/max values, not full-day extremes. Open-Meteo provides daily extremes directly. Weather times are shown in the selected location's local time. No fabricated weather data is used on errors.

## Deploy

Deploy the root folder as a static site (Vercel: Other framework, no build command, output directory `.`). `server.js` is only a local development server. Geolocation requires HTTPS or localhost.

## Files

- `index.html`: accessible page structure and settings dialog.
- `style.css`: responsive visual design and animations.
- `script.js`: UI, interactions, rendering and application state.
- `weather.js`: API requests and provider data normalization.

Data: https://open-meteo.com/ and https://openweathermap.org/. Fonts: Google Fonts, with system fallbacks.
