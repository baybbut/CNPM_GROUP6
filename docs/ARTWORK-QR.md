# Artwork QR catalogue

The header's Scan QR link (`/scan`) shows the public artwork catalogue with search, artist/material/museum filters and pagination. Selecting an artwork card opens its QR dialog, rather than navigating away. Only artworks returned by the public catalogue are listed; draft/hidden works remain excluded by the existing API rules.

The QR encodes an absolute URL to `/explore/artworks/:id?lang=…&source=qr`. Scanning with a phone camera opens the existing full detail page: image, artist, material, year/dimensions, description, available audio, history, and confirmed current museum when supplied by the backend. Missing source data is not fabricated. A hidden/deleted artwork produces the detail page's existing unavailable state. The dialog also provides an artwork link and PNG download, Escape/close/backdrop dismissal, focus trapping/restoration and mobile sizing.

The existing camera/image-upload/manual-link reader is retained at `/scan/camera`, accessible via **Scan an existing code**. Scanned external origins are never followed by this reader; only the validated artwork ID and allowed metadata are used on this website.

## Phone testing

From the repository root, keep SQL Server and the backend running, then start the visitor app:

```sh
npm --prefix muses-backend start
# In a second terminal:
npm --prefix muses-react run dev -- --host 0.0.0.0 --port 5173
```

Open the Vite **Network** URL (for example `http://192.168.1.27:5173/scan`) on the computer before generating a QR. The phone must be able to reach that address on the same Wi-Fi. A code generated from `localhost`/`127.0.0.1` points back to the scanning device itself; the dialog explains how to generate a usable network code. Internet sharing requires a reachable HTTPS deployment. Browser camera/GPS require HTTPS or localhost, although an ordinary phone camera can open a reachable HTTP network QR link.

Choose a published artwork, scan its QR and verify the same title, full description, metadata and selected language. Translations still follow the existing publication/fallback rules. No account or new DB migration is required.

## Automated checks

`npm --prefix muses-react test` covers QR parsing and route data validation. With Vite at port 5186 and Chromium CDP at 9222, `node muses-react/tests/browser/qr-directions.mjs` generates a real PNG QR, uploads it into the reader, and checks navigation to complete fixture artwork details. It also checks catalogue search/retry, modal keyboard/focus and responsive layout, and map directions with controlled fixtures. This does not substitute for testing a physical phone and the user's live DB/network.
