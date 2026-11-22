# Changelog

## 1.1 (2026-11-21)

- Added Highest rated, Popular, and Balanced restaurant sorting. Popular uses review count. Balanced combines a rating adjusted for review volume with a capped popularity score.
- Updated Fastest mode to compare walking, transit, and mixed trips before choosing the fastest option that fits the budget and time limits.
- Calculate return transit for each route's expected departure from the restaurant. Batch lookups with the same departure time and skip options that already exceed trip limits.
- Added Strict search to exclude trips without a meal price, known fares, or routed travel times. It filters the existing search results without making extra lookups to fill the list.
- Added a restaurant stay field with a 25-minute default. The entered duration applies to the whole search, including time limits and return transit, and replaces the wait buffer on individual results.
- Expanded the local Google Maps setup and verification instructions.
