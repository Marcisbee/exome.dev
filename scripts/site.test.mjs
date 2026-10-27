import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { chromium } from '@playwright/test';
import { lexer } from 'marked';

const origin = 'http://127.0.0.1:4322';
let server;
let browser;
before(async () => {
  server = spawn(process.execPath, ['scripts/preview.mjs'], { env: { ...process.env, PORT: '4322' }, stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Preview exited: ${code}`)));
    server.stdout.once('data', resolve);
  });
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

test('the static guide exposes complete examples and working destinations without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(origin);
  assert.equal(await page.locator('h1').textContent(), 'Introduction');
  const markdownLink = await page.locator('link[rel="alternate"][type="text/markdown"]').getAttribute('href');
  const response = await fetch(new URL(markdownLink, origin));
  assert.match(response.headers.get('content-type'), /text\/markdown/);
  const markdown = await response.text();
  const examples = lexer(markdown).filter(token => token.type === 'code').map(token => token.text);
  const pkg = JSON.parse(await readFile(new URL(import.meta.resolve('exome/package.json')), 'utf8'));
  for (const entry of Object.keys(pkg.exports).filter(entry => entry !== './package.json')) {
    const name = entry === '.' ? 'exome' : `exome/${entry.slice(2)}`;
    const id = name.replaceAll('/', '-');
    const section = page.locator(`section[id="${id}"]`);
    assert.equal(await section.count(), 1, `Missing reference for ${name}`);
    assert.ok(await section.locator('table, pre').count(), `Missing contract or example for ${name}`);
    assert.equal(await page.getByRole('navigation', { name: 'Documentation', exact: true }).getByRole('link', { name, exact: true }).count(), 1);
  }
  assert.ok(examples.length > 5);
  assert.deepEqual(await page.locator('pre code').allTextContents(), examples);
  const destinations = await page.locator('a[href], link[href], script[src], img[src]').evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('href') || node.getAttribute('src')).filter(url => !url.startsWith('https:')));
  for (const destination of new Set(destinations)) {
    if (destination === '#') continue;
    if (destination.startsWith('#')) {
      assert.equal(await page.locator(`[id="${destination.slice(1)}"]`).count(), 1, destination);
    } else {
      assert.equal((await fetch(new URL(destination, origin))).status, 200, destination);
    }
  }
  const index = await (await fetch(`${origin}/llms.txt`)).text();
  assert.match(index, /https:\/\/exome.dev\/index.md/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/#save-and-load`);
  assert.equal(await page.locator('#save-and-load').isVisible(), true);
  assert.equal(new URL(page.url()).hash, '#save-and-load');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal((await fetch(`${origin}/missing-page`)).status, 404);
  await context.close();
});

test('old documentation routes reach the replacement guide', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const routes = ['getting-started', 'basics', 'advanced', 'guides', 'tutorials/todo-app',
    ...['exome', 'state', 'utils', 'ghost', 'devtools', 'react', 'preact', 'vue', 'lit', 'rxjs', 'svelte', 'solid', 'angular'].map(name => `api/${name}`)];
  for (const route of routes) {
    await page.goto(`${origin}/${route}`);
    await page.waitForURL(url => url.pathname === '/' && !!url.hash);
    const hash = new URL(page.url()).hash;
    assert.equal(await page.locator(`[id="${hash.slice(1)}"]`).count(), 1, route);
  }
  await context.close();
});

test('copying and mobile navigation work in light and dark layouts', async () => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  const button = page.getByRole('button', { name: 'Copy Terminal' }).first();
  await button.click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'npm install exome');
  assert.equal(await button.textContent(), 'Copied');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('navigation', { name: 'Mobile documentation', exact: true }).getByRole('link', { name: 'API notes', exact: true }).click();
    assert.equal(await page.getByRole('dialog', { name: 'Documentation menu', includeHidden: true }).evaluate(node => node.open), false);
    assert.equal(new URL(page.url()).hash, '#api-notes');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog', { name: 'Documentation menu', includeHidden: true }).evaluate(node => node.open), false);
    assert.equal(await page.getByRole('button', { name: 'Open navigation' }).evaluate(node => node === document.activeElement), true);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForFunction(() => !document.querySelector('dialog').open);
    assert.equal(await page.locator('body').evaluate(node => getComputedStyle(node).overflow === 'hidden'), false);
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test('the documented store, async, and persistence examples run against the documented Exome release', async () => {
  const tokens = lexer(await readFile('site/guide.md', 'utf8'));
  const example = heading => tokens.slice(tokens.findIndex(token => token.type === 'heading' && token.text === heading) + 1).find(token => token.type === 'code').text;
  const moduleURL = source => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64')}`;
  const resolveImports = source => source.replace(/'exome(?:\/[^']+)?'/g, specifier => JSON.stringify(import.meta.resolve(specifier.slice(1, -1))));
  const { counter } = await import(moduleURL(resolveImports(example('Stores and actions'))));
  assert.equal(counter.count, 1);
  const { increment } = counter;
  increment();
  assert.equal(counter.doubled, 4);
  const { Profile } = await import(moduleURL(resolveImports(example('Async actions'))));
  const profile = new Profile();
  const { subscribe } = await import('exome');
  const states = [];
  const stop = subscribe(profile, () => states.push([profile.loading, profile.name]));
  await profile.load(async () => 'Grace');
  stop();
  assert.deepEqual(states, [[true, ''], [false, 'Grace']]);
  const todoURL = moduleURL(resolveImports(example('Nested stores')));
  const persistence = resolveImports(example('Save and load')).replace("'./todo.js'", JSON.stringify(todoURL));
  const result = await import(moduleURL(`${persistence}\nexport { list };`));
  assert.equal(result.list.items[0].title, 'Ship the docs');
  assert.equal(result.list.items[0].done, false);
  result.list.items[0].toggle();
  assert.equal(result.list.items[0].done, true);
  const statusModule = await import(moduleURL(resolveImports(`${example('exome/utils')}
export { status };`)));
  assert.equal(statusModule.status.loading, false);
  assert.deepEqual(statusModule.status.response, ['result']);
  const ghostModule = await import(moduleURL(resolveImports(`${example('exome/ghost')}
export { fixture };`)));
  assert.equal(ghostModule.fixture.count, 3);
  const counterURL = moduleURL(resolveImports(example('Stores and actions')));
  const radiExample = resolveImports(example('Manual Radi subscriptions')).replace("'./counter.js'", JSON.stringify(counterURL));
  const initialCount = counter.count;
  const radiModule = await import(moduleURL(`${radiExample}\nexport { values };`));
  assert.deepEqual(radiModule.values, [initialCount, initialCount + 1]);
  assert.equal(counter.count, initialCount + 2);

});

test('framework buttons share one counter with pointer, keyboard, and reduced-motion input', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  const count = page.getByLabel('Shared count', { exact: true });
  assert.equal(await count.textContent(), '0');
  const buttons = page.getByRole('group', { name: 'Shared counter demo' }).getByRole('button');
  for (let i = 0; i < await buttons.count(); i++) {
    await buttons.nth(i).click();
    assert.equal(await count.textContent(), String(i + 1));
  }
  const total = await buttons.count();
  await buttons.first().focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  assert.equal(await count.textContent(), String(total + 2));
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await buttons.last().click();
  assert.equal(await count.textContent(), String(total + 3));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await buttons.last().locator('.counter-burst').evaluate(node => node.getAnimations().length), 0);
  assert.deepEqual(errors, []);
  await context.close();
});
