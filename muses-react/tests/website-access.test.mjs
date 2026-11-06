import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_WEBSITE_URL,
  isLocalWebsite,
  websiteAccessUrl,
} from "../src/components/Scanner/websiteAccess.mjs";

test("website QR uses a phone-reachable address instead of loopback", () => {
  for (const origin of [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.2:5173",
    "http://[::1]:5173",
    "http://0.0.0.0:5173",
    "http://demo.localhost:5173",
    "http://localhost.:5173",
  ]) {
    assert.equal(websiteAccessUrl(origin), LOCAL_WEBSITE_URL);
  }
  assert.equal(
    websiteAccessUrl("http://192.168.31.88:5173/scan?lang=vi"),
    LOCAL_WEBSITE_URL,
  );
});

test("deployed website QR uses its own homepage or the configured public origin", () => {
  assert.equal(
    websiteAccessUrl("https://muses.example/scan?lang=vi"),
    "https://muses.example/",
  );
  assert.equal(
    websiteAccessUrl("http://localhost:5173", " https://museum.example/scan "),
    "https://museum.example/",
  );
  assert.equal(
    websiteAccessUrl("http://localhost:5173", "http://192.168.1.25:5173/"),
    "http://192.168.1.25:5173/",
  );
});

test("reject invalid, credentialed or loopback sharing configuration", () => {
  for (const address of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "ftp://museum.example",
    "https://user:password@museum.example",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "not a URL",
  ]) {
    assert.throws(() => websiteAccessUrl("http://localhost:5173", address));
  }
});

test("same-Wi-Fi guidance is shown only for local network addresses", () => {
  for (const address of [
    LOCAL_WEBSITE_URL,
    "http://10.0.0.1:5173/",
    "http://172.16.0.10/",
    "http://172.31.0.10/",
    "http://muses.local/",
    "http://[fd00::1]/",
  ]) {
    assert.equal(isLocalWebsite(address), true, address);
  }
  for (const address of [
    "https://muses.example/",
    "https://172.32.0.10/",
    "https://192.168.example.com/",
  ]) {
    assert.equal(isLocalWebsite(address), false, address);
  }
});
