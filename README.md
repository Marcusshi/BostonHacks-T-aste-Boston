# BostonHacks-T-aste-Boston

Find Boston restaurants by cuisine, budget, and available time. See Google Maps routes and compare walking or public transit, with color-coded lines and transfer stops.

## Run locally

1. Create `maps-config.js` next to `T-aste-Boston.html` and add your Google Maps browser key.

   ```js
   window.TASTE_BOSTON_MAPS_KEY = "YOUR_BROWSER_KEY";
   ```

2. From the repository folder, start a local web server.

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

3. Open [T-aste Boston](http://localhost:8000/T-aste-Boston.html).

Enable Maps JavaScript API, Places API (New), Routes API, and Maps Embed API in the Google Cloud project. Restrict the browser key to the websites that serve your copy of the app, such as `http://localhost:8000/*`. See the [Google Maps Platform security guidance](https://developers.google.com/maps/api-security-best-practices).
