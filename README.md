# BostonHacks-T-aste-Boston

Find Boston restaurants by cuisine, budget, and available time. See Google Maps routes and compare walking or public transit, with color-coded lines and transfer stops.

## Run locally

1. [Set up a Google Cloud project with billing](https://developers.google.com/maps/get-started). In the project's [API Library](https://console.cloud.google.com/apis/library), enable **Maps JavaScript API**, **Places API (New)**, **Routes API**, and **Maps Embed API**.

2. In [Credentials](https://console.cloud.google.com/apis/credentials), create an API key for local browser testing. Set its application restriction to **Websites**, allow `http://localhost:8000/*`, and restrict it to the enabled APIs used by the app. [Google Maps key restrictions](https://developers.google.com/maps/api-security-best-practices)

3. Create or edit `maps-config.js` next to `T-aste-Boston.html` and paste the browser key between the quotes. Git ignores this file.

   ```js
   window.TASTE_BOSTON_MAPS_KEY = "YOUR_BROWSER_KEY";
   ```

4. From the repository folder, start a local web server.

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

5. Open [T-aste Boston](http://localhost:8000/T-aste-Boston.html) over HTTP so the browser sends the authorized website referrer to Google.

To verify the integration without sharing your location, choose **Boston Common Visitor Center** as the start, leave the after-meal destination blank, and search. Confirm that restaurant results load, then select a transit result to check travel times, stops, and the embedded map. Routes and Places calls use your project's quota and billing.
