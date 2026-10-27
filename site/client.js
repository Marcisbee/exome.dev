for (const button of document.querySelectorAll('.copy')) {
  if (!navigator.clipboard) continue;
  button.hidden = false;
  let reset;
  button.addEventListener('click', async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(button.closest('figure').querySelector('code').textContent);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select code to copy';
    }
    reset = setTimeout(() => { button.textContent = 'Copy'; }, 1800);
  });
}
const menu = document.querySelector('.mobile-menu details');
menu.addEventListener('click', event => {
  if (!event.target.closest('a[href^="#"]')) return;
  menu.open = false;
  document.querySelector(event.target.closest('a').getAttribute('href'))?.focus({ preventScroll: true });
});
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
const links = [...document.querySelectorAll('[data-section-link]')];
const headings = [...document.querySelectorAll('main h2')];
for (const heading of headings) heading.tabIndex = -1;
let pending = false;
function markSection() {
  const current = headings.findLast(heading => heading.getBoundingClientRect().top <= 120) || headings[0];
  for (const link of links) {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  pending = false;
}
addEventListener('scroll', () => {
  if (!pending) { pending = true; requestAnimationFrame(markSection); }
}, { passive: true });
markSection();
