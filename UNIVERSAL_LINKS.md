# Universal Links deployment

This repository contains the public pieces of FluidCast podcast and episode
sharing:

- `/.well-known/apple-app-site-association` associates `/podcast/` and
  `/episode/` links with the production iOS app.
- `/.well-known/assetlinks.json` associates the same host with the production
  Android app (`com.FluidCastApp.FluidCast`) for Google Play App Links.
  GitHub Pages serves `.json` as `Content-Type: application/json`, which is
  what Play Console requires. Do not rename this file or wrap it in HTML.
- `/podcast/index.html` and `/episode/index.html` are the fallbacks. On iPhone,
  iPad, and Android, their **Open FluidCast** action first invokes the matching
  `fluidcast://` route and falls back to the App Store or Google Play if the
  app does not open; on desktop they remain on the FluidCast website.
- `.nojekyll` ensures the `.well-known` directory is included in the published
  GitHub Pages output.

## Required production header

GitHub Pages serves extensionless files as `application/octet-stream` and cannot
set a response header for one path. Before the iOS build is distributed, put the
custom domain behind a CDN or reverse proxy and configure this exact path:

```text
/.well-known/apple-app-site-association
Content-Type: application/json
```

For Cloudflare, a Response Header Transform Rule matching that URI path can set
the static `Content-Type` value while leaving GitHub Pages as the origin. The
AASA request must not redirect.

Android does not need that rule. `assetlinks.json` already has a `.json`
extension, so GitHub Pages returns `application/json` (a charset parameter is
fine). The statement must be served from `https://fluidcastapp.com` with no
redirect. `www.fluidcastapp.com` redirects to the apex host; the Android
intent filter only declares `fluidcastapp.com`.

After merging and deploying this branch, verify:

```sh
curl -i https://fluidcastapp.com/.well-known/apple-app-site-association
curl -i https://fluidcastapp.com/.well-known/assetlinks.json
```

Each response must be HTTP 200, contain the committed JSON, and have no
`Location` header. The Apple file must be `Content-Type: application/json`
(an optional charset is fine). The Android file must be
`Content-Type: application/json`. Apple normally fetches the association
through its CDN within 24 hours. After Play Console domain checks pass,
users need an app update that includes the verified intent filters before
those links open the app instead of the browser.
