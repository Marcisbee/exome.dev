import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { generateStaticSite } from 'radi/static';
import { createElement as h } from 'radi/server';
import { page } from '../site/page.mjs';

const outDir = 'docs/dist';
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const markdown = await readFile('site/guide.md', 'utf8');
const content = await page(markdown);
const legacy = {
  'getting-started': 'install', basics: 'stores-and-actions', advanced: 'action-effects-and-middleware',
  guides: 'nested-stores', 'tutorials/todo-app': 'nested-stores',
  'api/exome': 'exome',
  ...Object.fromEntries(['state', 'utils', 'devtools', 'ghost', 'react', 'preact', 'vue', 'lit', 'rxjs', 'svelte', 'solid', 'angular']
    .map(name => [`api/${name}`, `exome-${name}`])),
};
const routes = [{
  path: '/', title: 'Exome — State management reference',
  head: [
    h('script', { src: '/client.js', defer: true }),
    h('link', { rel: 'stylesheet', href: '/style.css' }),
    h('link', { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' }),
    h('link', { rel: 'canonical', href: 'https://exome.dev/' }),
    h('link', { rel: 'alternate', type: 'text/markdown', href: '/index.md', title: 'Complete Exome guide' }),
    h('link', { rel: 'describedby', href: '/llms.txt' }),
    h('meta', { name: 'description', content: 'Concise Exome documentation for agents: stores, actions, nested state, subscriptions, framework adapters, and persistence.' }),
  ], render: () => content,
}, ...Object.entries(legacy).map(([path, anchor]) => ({
  path: `/${path}/`, title: 'Exome — Documentation moved',
  head: [h('meta', { 'http-equiv': 'refresh', content: `0;url=/#${anchor}` }),
    h('link', { rel: 'canonical', href: `https://exome.dev/#${anchor}` })],
  render: () => h('main', null, h('h1', null, 'Documentation moved'),
    h('a', { href: `/#${anchor}` }, 'Open the Exome guide')),
}))];
await generateStaticSite(routes, async (path, html) => {
  await mkdir(dirname(join(outDir, path)), { recursive: true });
  await writeFile(join(outDir, path), html);
});
for (const name of ['style.css', 'client.js', 'icon.svg', 'inter.woff2', 'ibm-plex-serif.woff2', 'jetbrains-mono.woff2',
  'inter-license.txt', 'ibm-plex-serif-license.txt', 'jetbrains-mono-license.txt', 'radi-license.txt']) {
  await cp(`site/${name}`, `${outDir}/${name}`);
}
await writeFile(`${outDir}/index.md`, markdown);
await writeFile(`${outDir}/llms.txt`, '# Exome\n\n> Class-based state management. Reference for Exome 2.8.1.\n\n## Documentation\n\n- [Complete guide](https://exome.dev/index.md): Installation, actions, subscriptions, adapters, persistence, API notes, and limitations.\n- [HTML guide](https://exome.dev/): The same content for browser readers.\n');
await writeFile(`${outDir}/CNAME`, 'exome.dev\n');
await writeFile(`${outDir}/robots.txt`, 'User-agent: *\nAllow: /\nSitemap: https://exome.dev/sitemap.xml\n');
await writeFile(`${outDir}/sitemap.xml`, '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://exome.dev/</loc></url></urlset>\n');
await writeFile(`${outDir}/404.html`, '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found — Exome</title><link rel="stylesheet" href="/style.css"><main class="not-found"><h1>Page not found</h1><p><a href="/">Open the Exome documentation →</a></p></main></html>');
console.log(`Built ${routes.length} Radi SSG pages in ${outDir}/`);
if (process.argv.includes('--serve')) await import('./preview.mjs');
