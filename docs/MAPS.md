# Visitor maps

The `/museums` page immediately displays a small reference list of four real HCMC museums (Fine Arts, War Remnants, History and HCMC Museum) bundled in `muses-react/src/data/hcmPlaces.json`. The pins are deliberately rounded and labelled approximate, not survey-verified coordinates; reference entries link to background sources, and directions use the museum name and street address to avoid routing to an approximate point. These fallback coordinates and addresses have not been live-verified from this cloud environment. They are never used to infer an artwork’s current museum.

It additionally discovers actual museums, galleries and arts centres in Ho Chi Minh City from OpenStreetMap. It queries the administrative area tagged `ISO3166-2=VN-SG`; the map starts in central HCMC. No synthetic catalogue demo venues are inserted into these results. OpenStreetMap coverage and place details are community maintained: a venue marker is not confirmation that a particular temporary exhibition is currently running. Venue website and source links let visitors check the programme and opening hours.

## Run locally

1. From the repository root, install the new map dependency: `npm --prefix muses-react ci`.
2. Keep SQL Server running and restart the backend: `npm --prefix muses-backend start`.
3. In another terminal start the visitor app: `npm --prefix muses-react run dev -- --port 5173`.
4. Open `/museums`. There is no new DB migration or API key for this change.

The backend needs outbound HTTPS to `overpass-api.de` or `overpass.kumi.systems`; browsers need `tile.openstreetmap.org` for map tiles. Requests are fixed to the HCMC area, given a 15-second HTTP timeout per provider (longer than the query’s 12-second limit), cached in server memory for six hours and coalesced across visitors. A provider failure tries the backup provider, uses a previous successful cache if available, and backs off for one minute. A first-load failure serves the labelled reference list, with a retry action and an external Google Maps search. The visitor also imports the same reference list directly so API 404, 503, timeout or an unavailable backend does not erase all markers. A good previously fetched cache still takes priority over the reference list. Browser tiles can fail separately from venue search, while addresses and directions remain usable. This public-provider approach suits local testing; production capacity should use a suitable hosted map service if traffic grows.

## Visitor location

GPS is requested only when the visitor presses **Use my location**, with a timeout and a recoverable denial state. Coordinates are kept in component memory, not sent to the Muses API, analytics or local storage. The visible map requests third-party map tiles for the displayed area. Distances are straight-line distances calculated in the browser, not driving distances. Directions open Google Maps with only the destination coordinates; the visitor can supply their start location there.

Browser geolocation requires HTTPS or localhost. An ordinary `http://192.168…` address on a phone may display the map but cannot use GPS; use HTTPS when testing phone location. Refusing GPS does not block search or map browsing. Resetting to HCMC clears the in-memory position.

## Artwork location

The artwork detail map uses `currentExhibition` from the existing catalogue API. This is the museum from a **Confirmed** display schedule that is active today in Vietnam time, at a public museum. It does not infer the display location from `OwnerMuseumID` or from a nearby OSM venue. If there is no confirmed schedule, the page states that instead of placing an arbitrary pin. Invalid/missing coordinates do not become `(0,0)`.

In Admin, maintain the real museum address/coordinates and confirmed display schedules in **Museum Info & Maps** / **Exhibitions & Events**. Existing demo schedules remain labelled as demonstrations. The catalogue link on a discovery card is added only for a non-demo public catalogue museum with a matching name and a pin within 250 metres of the OSM venue.

## Verification limits

Unit tests cover normalization, gallery classification, excluded private/disused places, unsafe website URLs, cache/coalescing, provider fallback and outage handling, reference-list recovery and name/address routing, multilingual search, distances and conservative catalogue matching. Browser tests use controlled API responses for marker selection, GPS refusal/success, filters and responsive widths; these are not a check of real-world map accuracy. The cloud environment blocks outbound requests to the public OSM/Overpass services, so a successful live venue fetch and real tile rendering must be checked on the user's local network. Live SQL schedule/migration verification remains separate.
