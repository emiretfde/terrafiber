const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('fs');
(async () => {
  fs.mkdirSync('docs/screenshots', { recursive:true });
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  for (const v of [{name:'desktop',width:1440,height:900},{name:'mobile',width:375,height:812}]) {
    const ctx = await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page = await ctx.newPage(), errors=[];
    page.on('pageerror', err=>errors.push(String(err)));
    await page.goto('http://127.0.0.1:8123/nl/', {waitUntil:'domcontentloaded',timeout:30000});
    await page.evaluate(()=>{for(const img of document.querySelectorAll('img[loading="lazy"]'))img.loading='eager';});
    await Promise.race([
      page.evaluate(()=>Promise.all([...document.images].map(img=>img.complete?null:new Promise(done=>{
        img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
      })))),
      page.waitForTimeout(5000)
    ]);
    await page.evaluate(()=>document.fonts.ready);
    const info = await page.evaluate(()=>({
      lang:document.documentElement.lang,
      width:document.documentElement.scrollWidth,
      viewport:innerWidth,
      loadedFont:document.fonts.check('400 16px "IBM Plex Sans"'),
      missingImages:[...document.images].filter(img=>!img.complete||!img.naturalWidth).length,
      heroNodes:document.querySelectorAll('.hero-art .map-house').length,
      langLabels:[...document.querySelectorAll('.language-switch a, .language-switch .language-active')].map(x=>x.textContent.trim()).join(','),
      heading:document.querySelector('h1')?.textContent.trim()
    }));
    assert.equal(info.lang,'nl'); assert.equal(info.width,v.width);
    assert.equal(info.loadedFont,true); assert.equal(info.missingImages,0);
    assert.equal(info.heroNodes,12); assert.equal(info.langLabels,'DE,NL,EN');
    assert.deepEqual(errors,[]);
    // Verify the form keeps the user on the page and explicitly says no data was sent.
    await page.locator('#name').fill('Voorbeeldgebruiker');
    await page.locator('#email').fill('voorbeeld@example.org');
    await page.locator('#topic').selectOption('Bürgerservice');
    await page.locator('#message').fill('Dit is een test.');
    await page.locator('#privacy').check();
    await page.locator('#contactForm button[type="submit"]').click();
    assert.match(await page.locator('#form-status').textContent(),/geen formuliergegevens verstuurd/i);
    await page.screenshot({path:`docs/screenshots/terraFIBER-nl-${v.name}.png`,fullPage:true,animations:'disabled'});
    console.log(v.name, JSON.stringify({...info,errors,previewFormBlocked:true}));
    await ctx.close();
  }
  await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
