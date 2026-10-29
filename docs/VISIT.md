# Visit page

`/visit` is a complete, five-language visit guide with nine sections: admission, directions, collection/QR, preparation, café breaks, family, groups, accessibility and FAQ. It keeps the museum site's cream/brown palette, uses existing local images and icon assets, and has a sticky section menu that follows scrolling. Decorative gallery, coffee and craft photos are editorial imagery, not claims about the selected venue's facilities. Every action routes to an existing page, a real section or an external map search; there are no unfinished “See more” links or placeholder FAQ answers.

## Destination, tickets and maps

- The destination selector works with the four existing real-world reference museums even if the API is unavailable. Non-demo public catalogue museums with coordinates are added. Existing conservative name/coordinate matching links references to catalogue IDs without guessing where an artwork is located.
- The selected venue drives its address, map pin, directions, café search and ticket-page link. Reference pins stay approximate; directions use name/address. The map has the limitations documented in [MAPS.md](MAPS.md).
- Only a matching, non-demo `/api/tickets/prices` record supplies prices and recorded applicability weekdays. Visit does not invent opening hours, show demo prices as real admission, or claim all museums close on Wednesday / offer free entry for all under-18s. Opening hours link to the venue listing for confirmation.
- The selected museum ID and a valid date are carried into `/tickets?museum=…&date=…`. Ticket now shows a read-only price directory filtered to that museum, with the date retained as visit context. It does not create a booking.
- If ticket data fails, destination selection, maps and the guide remain usable, with an inline retry. No checkout, contact form, QR payment or order creation is offered in this flow.

General facilities, family, group and accessibility text advises visitors to check venue-specific policies. The guide does not promise unverified Wi-Fi, lifts, lockers, cafés, room closures, refunds, discounts or staffed group tours.

## Run and verify

No migration or new dependency is required. Pull the updated visitor branch, run `npm --prefix muses-react run dev -- --port 5173` from the repository root, and open `/visit`. Keep the existing backend running for ticket prices and published artwork previews.

Unit tests cover destination filtering/matching, offline references, booking parameters, dates and complete five-language copy. `tests/browser/visit.mjs` uses controlled API fixtures to verify changed destination/price/map, museum/date transfer to price lookup, section navigation, FAQ, responsive widths, language switching and API recovery. It does not verify real-world hours, prices, accessibility facilities, map-provider connectivity or payment. The Ticket browser test covers the price directory and Admin price updates, including absence of checkout requests.
