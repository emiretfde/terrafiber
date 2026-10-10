const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  fs.mkdirSync('docs/screenshots', { recursive: true });
  for (const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:375,height:812}]) {
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    await page.goto('http://127.0.0.1:8123/en/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.evaluate(()=>{for(const image of document.querySelectorAll('img[loading="lazy"]'))image.loading='eager';});
    await Promise.race([
      page.evaluate(()=>Promise.all([...document.images].map(img=>img.complete?null:new Promise(done=>{img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});})))),
      page.waitForTimeout(5500)
    ]);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(350);
    const findings=await page.evaluate(()=>({
      lang:document.documentElement.lang,
      title:document.querySelector('h1')?.textContent.trim(),
      width:document.documentElement.scrollWidth,
      viewport:window.innerWidth,
      fontLoaded:document.fonts.check('400 16px "IBM Plex Sans"'),
      photos:[...document.images].filter(img=>!img.complete||!img.naturalWidth).length,
      nodes:document.querySelectorAll('.hero-art .map-house').length,
      germanSwitch:document.querySelector('.language-switch a[href="/"]')?.textContent.trim(),
      englishActive:document.querySelector('.language-switch .language-active')?.textContent.trim(),
      legalLink:document.querySelector('a[href="https://terrafiber.de/datenschutzerklaerung/"]')?.getAttribute('href')
    }));
    assert.equal(findings.lang,'en');
    assert.equal(findings.nodes,12);
    assert.equal(findings.germanSwitch,'DE');
    assert.equal(findings.englishActive,'EN');
    assert.equal(findings.fontLoaded,true);
    assert.equal(findings.width,viewport.width,'horizontal overflow');
    assert.equal(findings.photos,0,'some remote photos failed to load');
    assert.deepEqual(errors,[]);
    // Preview-only form must never claim successful submission.
    await page.locator('#name').fill('Preview Test');
    await page.locator('#email').fill('preview@example.org');
    await page.locator('#topic').selectOption('Projektanfrage');
    await page.locator('#message').fill('Please contact me.');
    await page.locator('#privacy').check();
    await page.locator('#contactForm button[type="submit"]').click();
    assert.match(await page.locator('#form-status').textContent(),/No form data has been transmitted/);
    await page.screenshot({path:`docs/screenshots/terraFIBER-en-${viewport.name}.png`,fullPage:true,animations:'disabled'});
    console.log(viewport.name,JSON.stringify({...findings,errors,previewFormBlocked:true}));
    await context.close();
  }
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
