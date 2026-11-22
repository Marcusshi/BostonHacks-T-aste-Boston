import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {createContext, runInContext} from "node:vm";

const html = readFileSync(new URL("../T-aste-Boston.html", import.meta.url), "utf8");
const appScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const now = new Date("2026-11-21T17:00:00Z");
const preferences = {budget:3000, time:120, travelMode:"auto", departureTime:now};
const walk = (minutes, estimated = false) => ({minutes, cost:0, transit:false, estimated});
const transit = (minutes, cost = 240) => ({minutes, cost, transit:true});
const route = (outbound, inbound) => ({outbound, inbound});
const restaurant = (routeOptions, overrides = {}) => ({
  id:"spot", venue:"Restaurant", pos:[42.35,-71.07], rating:4.5, reviews:40,
  price:1500, meal:20, openingPeriods:[{open:{day:0}}], routeOptions, ...overrides
});

function loadApp() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {defaultValue:"30", addEventListener() {}});
      return elements.get(id);
    }
  };
  const app = createContext({document, window:{}, URLSearchParams});
  runInContext(appScript, app, {filename:"T-aste-Boston.html"});
  return {app, elements};
}

const {app} = loadApp();
const rank = (places, overrides) => app.rankTrips(places, {...preferences, ...overrides}, now);

test("A: faster transit with unknown fares wins and displays a budget warning", () => {
  const {app, elements} = loadApp();
  const place = restaurant([route(walk(30), walk(30)), route(transit(5, null), transit(5, null))]);
  const [trip] = app.rankTrips([place], preferences, now);
  assert.equal(trip.minutes, 30);
  assert.equal(app.tripModes(trip), "Transit → Restaurant → Transit");
  assert.equal(trip.knownCost, 1800);
  assert.equal(trip.total, null);
  assert.equal(trip.budgetVerified, false);

  app.testTrip = trip;
  runInContext(`
    Object.assign(state, {selected:testTrip.id, ranked:[testTrip], origin:{name:"Start"}, end:{name:"End"}});
    loadPlaceDetails = () => {};
    renderDetail(false);
    renderDiagram(testTrip);
  `, app);
  assert.match(elements.get("detail").innerHTML,
    /Fastest available route\. Some costs are unavailable, so budget compatibility is not fully verified\./);
  assert.match(elements.get("detail").innerHTML, /Total time incl\. stay[\s\S]*?~30/);
  assert.match(elements.get("diagram").innerHTML, /Fare unavailable/);
  assert.doesNotMatch(elements.get("diagram").innerHTML, /\$0\.00/);
});

test("B: faster verified walking wins", () => {
  const [trip] = rank([restaurant([route(transit(20), transit(15)), route(walk(10), walk(10))])]);
  assert.equal(trip.minutes, 40);
  assert.equal(app.tripModes(trip), "Walk → Restaurant → Walk");
  assert.equal(trip.budgetVerified, true);
});

test("C: mixed route takes 60 minutes and transit returns use the corresponding outbound arrival", async () => {
  const {app} = loadApp();
  const requests = [];
  app.fetchRouteMatrix = async (_origins, _destinations, departure) => {
    requests.push(departure);
    const transit = Boolean(departure);
    const offset = transit ? (departure - now) / 60000 : null;
    const minutes = transit ? new Map([[0,15], [40,25], [55,30]]).get(offset) : requests.length === 1 ? 30 : 20;
    assert.ok(Number.isFinite(minutes));
    const route = {condition:"ROUTE_EXISTS", durationMillis:minutes * 60000, localizedValues:{transitFare:"$2.40"}};
    return {rows:[{items:[route]}]};
  };
  const place = restaurant([], {meal:25});
  const endpoint = {pos:[42.36,-71.06]};
  const plan = await app.planRoutes([place], {...preferences, origin:endpoint, end:endpoint});
  const options = plan.places[0].routeOptions;
  assert.deepEqual(Array.from(options, ({outbound, inbound}) =>
    [outbound.transit, inbound.transit]), [[false,false], [false,true], [true,false], [true,true]]);
  assert.equal(requests.length, 5);
  assert.deepEqual(requests.filter(Boolean).map(departure => (departure - now) / 60000).sort((a,b) => a-b),
    [0,40,55]);

  const [trip] = app.rankTrips(plan.places, preferences, now);
  assert.equal(trip.minutes, 60);
  assert.equal(app.tripModes(trip), "Transit → Restaurant → Walk");

  const [returnTransit] = app.rankTrips(plan.places, {...preferences, travelMode:"transit"}, now);
  assert.equal(returnTransit.inbound.departureTime.getTime(), now.getTime() + 40 * 60000);
});

test("D: time limit includes the restaurant stay and requires both leg times", () => {
  for (const minutes of [20, null, undefined, Infinity, NaN]) {
    const place = restaurant([route(walk(25), walk(minutes))], {meal:25});
    assert.equal(rank([place], {time:60}).length, 0);
  }
  assert.equal(rank([restaurant([route(walk(15), walk(20))], {meal:25})], {time:60})[0].minutes, 60);
});

test("E: reject known costs over budget, including the reserve and partial fares", () => {
  const expensive = route(transit(5, 750), transit(5, 750));
  const walking = route(walk(15), walk(15));
  assert.equal(rank([restaurant([expensive], {price:2000})]).length, 0);
  assert.equal(rank([restaurant([expensive, walking], {price:2000})])[0].outbound, walking.outbound);
  const overBudgetWithReserve = route(transit(5, 400), transit(5, 400));
  assert.equal(rank([restaurant([overBudgetWithReserve], {price:2000})]).length, 0);

  const partial = route(transit(5, 3100), transit(5, null));
  assert.equal(rank([restaurant([partial], {price:null})]).length, 0);
  const [unknownMeal] = rank([restaurant([route(transit(5), transit(5, null))], {price:null})]);
  assert.equal(unknownMeal.knownCost, 240);
  assert.equal(unknownMeal.budgetVerified, false);
});

test("F: Strict Search uses the fastest fully verified eligible option", () => {
  const walking = route(walk(25), walk(25));
  const place = restaurant([
    route(transit(5, null), transit(5)),
    route(walk(5, true), walk(10)),
    route(transit(null), transit(3)),
    walking
  ]);
  const [trip] = rank([place], {strictSearch:true});
  assert.equal(trip.outbound, walking.outbound);
  assert.equal(trip.inbound, walking.inbound);
  assert.equal(rank([{...place, price:null}], {strictSearch:true}).length, 0);
});

test("G: restaurant sorting changes the order while each restaurant keeps its route", () => {
  const places = [
    restaurant([route(walk(30), walk(30)), route(transit(20, null), walk(30))],
      {id:"highest-rated", rating:5, reviews:1}),
    restaurant([route(walk(10), walk(12))], {id:"popular", rating:4.8, reviews:1500})
  ];
  const [highest, popular] = rank(places, {sortBy:"rating"});
  assert.equal(highest.id, "highest-rated");
  assert.equal(popular.id, "popular");
  assert.ok(highest.minutes > popular.minutes);
  for (const sortBy of ["balanced", "popular"]) {
    const [first, second] = rank(places, {sortBy});
    assert.equal(first.id, popular.id);
    assert.equal(second.id, highest.id);
    assert.equal(second.outbound, highest.outbound);
    assert.equal(second.inbound, highest.inbound);
  }
});

test("equal durations favor verified budget, then known cost, then fewer transit legs", () => {
  const walking = route(walk(5), walk(5));
  const mixed = route(transit(5, 0), walk(5));
  const verified = route(transit(5), transit(5));
  const unverified = route(transit(5, null), transit(5, null));
  assert.equal(rank([restaurant([unverified, verified])])[0].outbound, verified.outbound);
  assert.equal(rank([restaurant([verified, mixed])])[0].outbound, mixed.outbound);
  assert.equal(rank([restaurant([mixed, walking])])[0].outbound, walking.outbound);
});

test("walking and transit modes stay restricted, and untimed trips are transit previews only", () => {
  const place = restaurant([route(walk(20), walk(20)), route(transit(5), transit(5))]);
  assert.equal(app.tripModes(rank([place], {travelMode:"walking"})[0]), "Walk → Restaurant → Walk");
  assert.equal(app.tripModes(rank([place], {travelMode:"transit"})[0]), "Transit → Restaurant → Transit");

  const untimed = restaurant([route(transit(5), transit(null, null))]);
  assert.equal(rank([untimed], {travelMode:"transit"}).length, 0);
  assert.equal(rank([untimed], {includeTransitPreviews:true}).length, 0);
  const preview = {travelMode:"transit", includeTransitPreviews:true};
  assert.equal(rank([untimed], preview)[0].minutes, null);
  assert.equal(rank([untimed], {...preview, strictSearch:true}).length, 0);
});

test("scheduled searches include Places candidates that are not open now", async () => {
  const {app} = loadApp();
  const requests = [];
  app.loadPlacesLibrary = async () => ({Place:{searchByText:async request => {
    requests.push(request);
    return {places:[]};
  }}});
  const filters = {query:"", cuisine:"korean", cuisineLabel:"Korean", budget:3000};

  await app.searchGoogleRestaurants(filters);
  assert.ok(requests.length > 0);
  assert.ok(requests.every(request => request.isOpenNow === true));
  requests.length = 0;

  await app.searchGoogleRestaurants({...filters, scheduledDeparture:new Date("2026-11-22T17:00:00Z")});
  assert.ok(requests.length > 0);
  assert.ok(requests.every(request => !Object.hasOwn(request, "isOpenNow")));
});

test("a planned Boston departure uses arrival hours and respects special closures", () => {
  const morning = new Date("2026-11-22T12:30:00Z");
  const noon = app.parseBostonDeparture("2026-11-22T12:00", morning);
  const hours = [{open:{day:0, hour:12, minute:15}, close:{day:0, hour:22}}];
  const early = route(transit(10), walk(10));
  const afterOpening = route(walk(20), walk(10));
  const place = restaurant([early, afterOpening], {
    hoursCheckedAt:morning, currentOpeningPeriods:hours, regularOpeningPeriods:hours
  });

  assert.equal(noon.toISOString(), "2026-11-22T17:00:00.000Z");
  assert.equal(app.rankTrips([place], preferences, morning).length, 0);
  assert.equal(app.rankTrips([place], {...preferences, scheduledDeparture:noon}, morning)[0].outbound,
    afterOpening.outbound);
  const specialClosure = {...place, currentOpeningPeriods:[]};
  assert.equal(app.rankTrips([specialClosure], {...preferences, scheduledDeparture:noon}, morning).length, 0);
});
