const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  fs.mkdirSync('docs/screenshots', { recursive: true });
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 375, height: 812 }
  ];
  let overflow = false;
  for (const v of viewports) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2400);
    const metrics = await page.evaluate(() => ({
      innerWidth: innerWidth, docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      font: getComputedStyle(document.body).fontFamily,
      fontLoaded: document.fonts.check('400 16px "IBM Plex Sans"'),
      headline: document.getElementById('hero-title')?.textContent,
      mapHouses: document.querySelectorAll('.hero-art .map-house').length,
      serviceCards: document.querySelectorAll('.citizen-service .citizen-cards a').length,
      brokenImgs: [...document.images].filter(x => !x.complete || x.naturalWidth === 0).length
    }));
    if (metrics.docWidth > v.width + 1 || metrics.bodyWidth > v.width + 1) overflow = true;
    console.log(v.name, JSON.stringify({ ...metrics, errors }));
    await page.screenshot({ path: `docs/screenshots/terraFIBER-v9-${v.name}.png`, fullPage: true, animations: 'disabled' });
    await ctx.close();
  }
  await browser.close();
  if (overflow) {
    console.error('Responsive layout overflow detected; screenshots still available for inspection.');
  }
})().catch(err => { console.error(err); process.exit(1); });
