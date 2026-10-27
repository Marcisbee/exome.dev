import { createElement as h } from 'radi/server';
import { lexer } from 'marked';
import { counterDemo } from './counter-view.mjs';
import { code, section } from './ui.mjs';

export const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function render(tokens) {
  return Promise.all(tokens.map(async token => {
    const children = () => render(token.tokens ?? []);
    switch (token.type) {
      case 'space': return null;
      case 'text': return token.tokens ? children() : token.text;
      case 'escape': return token.text;
      case 'paragraph': return h('p', null, await children());
      case 'strong': return h('strong', null, await children());
      case 'em': return h('em', null, await children());
      case 'codespan': return h('code', null, token.text);
      case 'link': return h('a', { href: token.href }, await children());
      case 'heading': return h(`h${token.depth}`, { id: slug(token.text) },
        h('a', { href: `#${slug(token.text)}`, class: 'heading-link' }, await children()));
      case 'list': return h(token.ordered ? 'ol' : 'ul', token.ordered ? { start: token.start } : null,
        await Promise.all(token.items.map(async item => h('li', null, await render(item.tokens)))));
      case 'table': {
        const header = await Promise.all(token.header.map(async cell =>
          h('th', { scope: 'col' }, await render(cell.tokens))));
        const rows = await Promise.all(token.rows.map(async row =>
          h('tr', null, await Promise.all(row.map(async cell =>
            h('td', null, await render(cell.tokens)))))));
        return h('div', { class: 'table-scroll', tabindex: '0', 'aria-label': 'Reference table' },
          h('table', null, h('thead', null, h('tr', null, header)), h('tbody', null, rows)));
      }
      case 'code': return code(token.lang === 'sh' ? 'Terminal' : 'Example', token.text, token.lang || 'text');
      default: throw new Error(`Unsupported guide syntax: ${token.type}`);
    }
  }));
}

export async function content(markdown) {
  const tokens = lexer(markdown);
  const firstSection = tokens.findIndex(token => token.type === 'heading' && token.depth === 2);
  const paragraphs = tokens.slice(0, firstSection).filter(token => token.type === 'paragraph');
  const introduction = h('section', { class: 'intro', id: 'overview' },
    h('h1', null, 'Introduction'),
    h('p', { class: 'lead' }, await render(paragraphs[0].tokens)),
    h('div', { class: 'intro-links' },
      h('a', { class: 'primary', href: '#install' }, 'Install Exome →'),
      h('a', { href: '/index.md' }, 'Read as Markdown ↗')),
    await render(paragraphs.slice(1)),
    h('div', { id: 'counter-demo' }, counterDemo(h)),
    h('noscript', null, 'Enable JavaScript to try the shared counter.'));
  const sections = [];
  let heading;
  let body = [];
  async function flush() {
    if (heading) sections.push(section(slug(heading.text), heading.text, await render(body)));
  }
  for (const token of tokens.slice(firstSection)) {
    if (token.type === 'heading' && token.depth === 2) {
      await flush();
      heading = token;
      body = [];
    } else body.push(token);
  }
  await flush();
  return { introduction, sections };
}
