# Ticket: museum admission price lookup

The current product request changes `/tickets` into **Tra cứu giá vé**. Visitors search museums by name/address, select a visitor category, sort by name or price, read admission conditions and open venue information/directions. It is not a purchase flow: there is no buyer/contact form, quantity selector, consent step, payment QR or checkout request. UI is available in Vietnamese, English, Chinese, Japanese and Korean.

## Data and Admin

- `GET /api/tickets/prices` is public and read only. It returns public non-demo museums, left joined to enabled `TicketOffers` records. A museum without a public price record has `null` prices, not zero.
- Price fields reuse `AdultPrice`, `ConcessionPrice`, `ChildPrice`, `Terms`, `ClosedWeekdays`, `IsEnabled` and `UpdatedAt` in the existing table. No new DB migration is needed for this change if Ticket tables are already installed.
- In **Admin → Giá vé** (`#Tickets`), choose the museum, enter all three integer VND prices, add applicable age/document conditions and publish the price list. New inputs start empty, not zero. `IsEnabled` is presented as **Công khai bảng giá**. The museum also needs to be public; demo museums are excluded from visitor prices.
- Exactly `0` means free. Missing, invalid or unpublished prices display **Chưa cập nhật**. Unknown prices sort after known prices. A free children's category does not make the adult category free.
- `UpdatedAt` is the record update date, not proof of external source verification. Values are the museum information entered in Admin, not prices scraped or verified live from official sites. Admission conditions and final prices can change; visitors should check directly with the venue.
- The existing four reference museums remain browsable if the API is down, with prices left unknown. Their approximate pins do not become price verification. No sample price is advertised as real admission.

## Links and running

Header/Home/Visit link to the lookup page. Museum/date parameters coming from Visit are retained as context. The **Plan your visit** link returns to Visit with the selected destination. Dates do not create reservations or imply that a venue is open.

From the repository root, pull the updated branch, restart `npm --prefix muses-backend start`, and run the visitor/Admin Vite apps as usual. No new dependency is required. Legacy reservation records, receipt routes and backend payment compatibility code have not been deleted; none is invoked by the new price page. Existing reservation/legacy backend unit tests remain as regression protection, not evidence of an active visitor checkout.

## Verification

Unit/API tests cover null-vs-zero prices, excluding demo/hidden museums, name matching, accent-insensitive search, price sorting and a guest price API that creates no order. Browser fixtures cover lookup/search/category/sort, conditions, free vs unknown prices, five languages, 375/768/1440 widths, API failure/retry, Visit destination round trip and Admin saving a price. They assert no `/api/tickets/checkout` requests and no reservation requests in the new Admin page. They do not verify real museum prices, current official policies or live SQL permissions.
