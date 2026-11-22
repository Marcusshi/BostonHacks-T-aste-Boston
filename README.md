# T-aste Boston

T-aste Boston is a BostonHacks project that helps you find a place to eat between stops in Boston. Enter where you're starting, where you need to be after the meal, and how much time and money you have. The planner recommends open restaurants and shows how to get there and back.

## Plan a trip

1. Pick a Boston landmark or enter an address. You can also use your location if you grant browser permission. Leave the after-meal destination blank to return to your starting point.
2. Set a per-person budget, total time, and restaurant stay. Filter by cuisine or enter a restaurant or dish.
3. Choose **Fastest (walk or transit)**, **Walking**, or **Public transit**, then select **Find restaurants**.
4. Sort by **Highest rated**, **Popular** (review count), or **Balanced** (rating and review count). Open a result to see its cost breakdown, opening hours, photos and reviews when available, and the outbound and return directions. Switch legs above the map to inspect stops, transfers, and departure times.

## How trips are selected

In Fastest mode, the planner considers walk/walk, transit/transit, walk/transit, and transit/walk when routes are available. It adds both travel legs and the full restaurant stay. A transit return is looked up for the expected time you leave the restaurant, based on the outbound route and stay.

A recommendation needs a travel time for both legs. The complete trip must fit the time limit, and its known costs must fit the budget. The planner selects the shortest eligible trip for each restaurant. For equal durations it prefers complete cost information, then lower known cost, then fewer transit legs. Restaurant sorting is applied after route selection.

The cost estimate uses Google's starting meal price, a 20% tax and tip reserve, and available fares. A route with a missing meal price or fare can appear with a **budget unverified** label. Turn on **Strict search** to require a meal estimate, known fares, and Google-routed times for both legs. When Public transit mode has incomplete route times, it can show separate transit previews outside Strict Search.

## Run locally

The app is a standalone HTML page with inline CSS and JavaScript. Python 3 is enough to serve it locally. Node.js is only needed for the tests.

1. Set up a [Google Cloud project with billing](https://developers.google.com/maps/get-started). In the [API Library](https://console.cloud.google.com/apis/library), enable **Maps JavaScript API**, **Places API (New)**, **Routes API**, and **Maps Embed API**.
2. Create a browser key under [Credentials](https://console.cloud.google.com/apis/credentials). Set its application restriction to **Websites**, allow `http://localhost:8000/*`, and restrict it to the four enabled APIs. [Google Maps key restrictions](https://developers.google.com/maps/api-security-best-practices)
3. Create `maps-config.js` next to `T-aste-Boston.html`. This local file is ignored by Git. The browser loads the key, so use a website-restricted key.

   ```js
   window.TASTE_BOSTON_MAPS_KEY = "YOUR_BROWSER_KEY";
   ```

4. From the repository directory, start the local server.

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

5. Open [T-aste Boston](http://localhost:8000/T-aste-Boston.html) over HTTP so Google receives the allowed website referrer.

To test the live integration without sharing your location, choose **Boston Common Visitor Center** as the start and leave the after-meal destination blank. Run a search and open a result. Check the trip total, both map legs, and transit stops when available. API calls use the quota and billing of your Google Cloud project.

## Project layout and tests

| File | Purpose |
| --- | --- |
| [`T-aste-Boston.html`](T-aste-Boston.html) | Planner, search form, restaurant rankings, route comparison, and map UI. |
| [`tests/fastest-route.test.mjs`](tests/fastest-route.test.mjs) | Tests the planner's inline JavaScript with fixture data and mocked route matrices. |
| `maps-config.js` | Local browser key configuration. |

Run the route tests with Node.js 22 or newer. These tests do not need a key or network access.

```sh
node --test tests/fastest-route.test.mjs
```

The tests cover walking, transit and mixed routes, the return departure calculation, time and budget limits, missing costs, Strict Search, tie-breakers, and independent restaurant sorting.

## Data and coverage

The planner searches across Boston neighborhoods through Google Places and displays up to ten ranked matches. Results depend on the restaurants, hours, price ranges, routes, and fares Google returns. Meals and times are estimates, and transit schedules can change. Check the restaurant's current hours and prices and consult [MBTA service alerts](https://www.mbta.com/alerts) before leaving.

See the [changelog](CHANGELOG.md) for version history and the [MIT License](LICENSE) for project terms.
