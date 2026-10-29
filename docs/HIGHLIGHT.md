# Home Highlight

The home Highlight uses a dark, horizontal accordion layout: equal-height images crop with `object-fit: cover`, narrow cards remain visible, and the selected card expands to reveal its description and artwork link. Mouse hover, tap and keyboard focus select a card. Previous/next wrap in both directions; arrow keys, Home and End also work. Mobile uses centred scroll-snap cards with swipe selection and recentres after resizing. Reduced-motion settings disable expansion and scroll animation.

Content comes only from the published `/api/artworks` response in the selected language. Up to five distinct artworks follow configured `home.highlight.h1`–`h5` artwork IDs when those IDs are present in the public response, then fill from the public catalogue. A configured image overrides the primary artwork image only when its linked artwork is public. Static legacy event titles/dates are not displayed as current events. Card badges use actual catalogue categories; artist/year and descriptions use the artwork metadata.

Loading, API failure, no published works, one-card and broken-image states are supported. The collection and visit links route to existing pages. No migration or new dependency is required. A scoped Hero rule also restores the ticket icon's 20px size to prevent it from enlarging the mobile layout.

Unit tests verify publication-based slot matching, image bindings, deduplication and wrap selection. `tests/browser/highlight.mjs` uses controlled API fixtures for desktop expansion, hover/keyboard, both-direction wrap, mobile swipe/resize, detail links and one/empty/error states. Real SQL publication data is not created or modified by these tests.
