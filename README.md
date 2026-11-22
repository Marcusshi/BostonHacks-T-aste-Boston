# T-aste Boston

T-aste Boston is a BostonHacks project that helps you find a place to eat between stops in Boston. Enter where you're starting, where you need to be after the meal, and how much time and money you have. The planner finds restaurants expected to be open when you arrive and compares walking and public transit for both legs.

## Plan a trip

1. Pick a Boston landmark, enter an address, or choose **Use my location** and grant browser permission. Enter where you want to go after the meal, or leave that field blank to return to your starting point.
2. Set your **budget per person**, **available time**, and **restaurant stay**. The stay defaults to 25 minutes. The time limit covers both travel legs and the stay. The budget covers the meal and both legs' fares.
3. Leave **Departure (Boston time)** blank to leave now, or pick a future date and time to plan ahead. The time you enter is interpreted in Boston time regardless of how your device displays the picker.
4. Pick a cuisine, enter a restaurant or dish, or use both. Choose **Fastest (walk or transit)**, **Walking**, or **Public transit**. Turn on **Strict search** to require a meal estimate, known fares, and routed travel times for both legs. Then select **Find restaurants**.
5. Sort by **Highest rated**, **Popular**, or **Balanced**, and select a restaurant to inspect the trip.

For a lunch search, try **Boston Common Visitor Center** as the start, **South Station** as the destination, and **12:00 PM** for departure on your chosen date. Pick **Korean** and set the budget and time available. A restaurant that is closed in the morning can appear if it is expected to be open when you reach it.

## Read the results

- **Restaurant rankings** show up to 10 matches with ratings, review counts, the transport mode for each leg, total trip time, and known costs. The reported match count comes from the candidates evaluated for that search.
- **Restaurant details** show the cost breakdown, opening hours for the relevant day, photos and reviews when available, and both legs of the itinerary. For a planned trip, the detail uses the expected arrival day for its opening hours display.
- **Map and route** let you switch between the outbound and after-meal legs. The map can preview the recommended, walking, or transit directions. The route timeline shows departure estimates, boarding and exit stops, transit lines, and transfers when available. The Google Maps link opens that leg for navigation. The embedded map and navigation link can show different departures from the planner's schedule.
- **Higher-budget pick** can appear after you raise the budget and search again. It highlights the evaluated trip with the highest complete cost estimate above the previous limit that still fits the new limit and other filters.
- **Transit previews** can appear in Public transit mode when a full travel time is unavailable. They sit outside the ranked matches and are hidden by Strict search.

## How trips are selected

### Find restaurants and check opening hours

A standard search queries Google Places across seven overlapping Boston areas, requesting up to 20 results per area. The planner removes duplicate place IDs and checks addresses and cuisine categories. When you raise the budget, it may make a separate search for candidates in a higher price range. Recommendations use the live search results. There is no fixed restaurant inventory for the rankings.

- **Depart now** searches for restaurants that are currently open, then checks that they are also expected to be open at arrival.
- **Scheduled departure** searches without the current-hours filter. The planner checks opening hours at the expected arrival for each outbound route. It uses date-specific hours from Google when available for the next seven days, including today, and regular weekly hours for dates beyond that window. Searches that use transit require the trip window to end within the next 100 days.

### Compare time and cost across both legs

**Walking** and **Public transit** keep that mode for both legs. **Fastest** compares walk/walk, transit/transit, walk/transit, and transit/walk when those routes are available.

```text
Expected arrival   = departure time + outbound travel time
Leave restaurant   = expected arrival + restaurant stay
Total trip time    = outbound travel + restaurant stay + after-meal travel
Known trip cost    = starting meal estimate + 20% tax and tip reserve + known fares
```

For example, leaving at **12:00 PM** with a **37-minute** outbound leg and a **25-minute** stay means the planner looks up after-meal transit for **1:02 PM**. A different outbound route can lead to a different departure time and a different service. The planner batches return-transit requests with the same departure time, reuses the walking leg from each restaurant, and skips options that already exceed time or known-cost limits before the after-meal leg.

A ranked trip needs time estimates for both legs. Its total time and known costs must fit the limits. The planner picks each restaurant's **shortest eligible trip**. For equal durations, it prefers complete cost information, then lower known cost, then fewer transit legs.

Google's starting meal price is an estimate. Walking costs $0, and transit fares are included when available. A missing meal price or fare leaves the trip labeled **budget unverified**, even when its known costs fit. **Strict search** removes those trips and excludes walking times estimated from straight-line distance. It filters the existing results without making extra route requests to fill the list.

### Rank the restaurants

Restaurant ranking happens after route selection. The budget, stay, and available time determine eligibility. The ranking modes use Google ratings and review counts.

| Sort by | Order |
| --- | --- |
| **Highest rated** (default) | Higher star rating, then more reviews. |
| **Popular** | More reviews, then higher star rating. |
| **Balanced** | Higher combined score, then higher star rating and more reviews. |

When the listed comparisons tie, the restaurant name gives a consistent order. **Balanced** gives 80% weight to a rating adjusted for review volume and 20% to a popularity score.

```text
adjusted rating = (stars × review count + 4.2 × 50) / (review count + 50)
popularity      = ln(1 + min(review count, 2000)) / ln(2001)
balanced score  = 0.8 × (adjusted rating / 5) + 0.2 × popularity
```

The rating moves toward 4.2 when reviews are sparse and approaches the original star rating as reviews accumulate. The logarithm gives diminishing weight to additional reviews, and the popularity contribution reaches its maximum at 2,000 reviews. For example, 4.8 stars from 450 reviews score about 91.9 out of 100, while 5.0 stars from two reviews score about 70.6.

The planner checks candidates in ranking order and can stop routing once it has enough matches for the list. Changing the sort order reuses routes already calculated for the search and can check additional candidates in the new order.

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

The tests cover walking, transit and mixed routes, the return departure calculation, time and budget limits, missing costs, Strict search, tie-breakers, and independent restaurant sorting. They also check that scheduled searches can include restaurants that open later and that arrival checks respect special closures.

## Data and coverage

Google Places supplies restaurant listings, ratings, hours, price ranges, photos, and reviews. Google Routes supplies route time estimates and any available fares. Results reflect the areas and candidates Google returns for the search. Restaurant hours, prices, and transit service can change, so check current details and [MBTA service alerts](https://www.mbta.com/alerts) before leaving.

See the [changelog](CHANGELOG.md) for version history and the [MIT License](LICENSE) for project terms.
