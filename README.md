# Exome documentation

A static reference for Exome 2.8.1, generated with Radi SSG. The website and
`/index.md` share `site/guide.md`; `/llms.txt` points agents to the complete guide.

## Develop

Use Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4321. Restart after editing. `npm run dev` builds and serves
the generated files; `npm run preview` serves the last build. Both bind to
loopback. Set `PORT` to change the port.

## Validate

```sh
npx playwright install chromium
npm test
```

Checks exercise the built site with and without JavaScript, Markdown discovery,
legacy URLs, local destinations, code copying, mobile navigation, and runnable
documentation examples. CI builds and checks pull requests and main.

## Publish

Run `npm ci && npm run build` and publish **docs/dist** at the domain root.
The output directory and build command match the previous Vocs site so existing
static-host settings can remain in place. Configure Node.js 22+ on the host.
No application server or browser framework runtime is needed. Existing URLs
such as `/basics/` and `/api/react/` redirect to the corresponding guide section.
An unknown URL should serve `404.html` with a 404 status, not an SPA fallback.

This repository does not change production hosting or DNS. The workflow uploads
the checked artifact without deploying it. Roll back by restoring the previous
successful deployment or reverting the site replacement and rebuilding.

## Edit

- `site/guide.md`: concise content and examples; use the installed Exome package
  and its source as the API authority.
- `site/page.mjs`: Radi server components and build-time Markdown rendering.
  Unsupported Markdown syntax fails the build rather than silently disappearing.
- `site/style.css`: Radi docs layout, light/dark palettes, responsive navigation.
- `site/client.js`: optional copy buttons and current-section indication.
- `scripts/build.mjs`: Radi SSG routes, static assets, and legacy entry points.

Typography and layout follow Radi's documentation. Inter, IBM Plex Serif, and
JetBrains Mono are self-hosted; their licenses ship beside the font files.
Exome's original icon is retained. Reading and navigating the guide requires no
JavaScript; native mobile navigation also works without it.
