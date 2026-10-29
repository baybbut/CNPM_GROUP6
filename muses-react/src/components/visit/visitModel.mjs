import referencePlaces from "../../data/hcmPlaces.json" with { type: "json" };
import { connectCatalogue, hasCoordinates } from "../Museums/placeModel.mjs";
import { validVisitDate } from "../Tickets/ticketModel.mjs";
export function visitDestinations(museums = []) {
  const real = museums.filter(
    (m) =>
      !m.isDemo &&
      m.isPublic !== false &&
      m.isPublic !== 0 &&
      hasCoordinates(m),
  );
  const reference = connectCatalogue(referencePlaces, real);
  const linked = new Set(reference.map((m) => m.museumId).filter(Boolean));
  return [
    ...reference,
    ...real
      .filter((m) => !linked.has(m.id))
      .map((m) => ({
        ...m,
        id: `catalog-${m.id}`,
        museumId: m.id,
        kind: "museum",
      })),
  ];
}
export function visitTicketLink(place, date) {
  const query = new URLSearchParams();
  if (place?.museumId) query.set("museum", String(place.museumId));
  if (validVisitDate({}, date)) query.set("date", date);
  return `/tickets${query.size ? `?${query}` : ""}`;
}
export function mapSearchUrl(place, category = "") {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${category} ${place.name}, ${place.address}`.trim() })}`;
}
