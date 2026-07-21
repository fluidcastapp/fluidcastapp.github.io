# Universal Links deployment

This repository contains the public pieces of FluidCast podcast sharing:

- `/.well-known/apple-app-site-association` associates `/podcast/` links with
  the production iOS app.
- `/podcast/index.html` is the fallback. On iPhone and iPad it opens the App
  Store listing; on desktop it remains on the FluidCast website.
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

After merging and deploying this branch, verify:

```sh
curl -i https://fluidcastapp.com/.well-known/apple-app-site-association
```

The response must be HTTP 200, have `Content-Type: application/json` (an
optional charset is fine), contain the committed JSON, and have no `Location`
header. Apple normally fetches the association through its CDN within 24 hours,
so deploy this before submitting the App Store review build.
