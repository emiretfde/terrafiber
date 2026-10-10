const {chromium}=require('playwright');
const fs=require('fs');
const assert=require('node:assert/strict');
const ROOT='http://127.0.0.1:8123';
(async()=>{
 fs.mkdirSync('docs/screenshots',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const locale of [{name:'de',a:'/',b:'/concept-b/'},{name:'en',a:'/en/',b:'/concept-b/en/'},{name:'nl',a:'/nl/',b:'/concept-b/nl/'}]){
  for(const size of [{name:'desktop',w:1440,h:900},{name:'mobile',w:375,h:812}]){
   const ctx=await browser.newContext({viewport:{width:size.w,height:size.h},deviceScaleFactor:1});
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(ROOT+locale.b,{waitUntil:'domcontentloaded',timeout:30000});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(1400);
   const info=await page.evaluate(()=>({
    lang:document.documentElement.lang,
    pageWidth:document.documentElement.scrollWidth,innerWidth:innerWidth,
    title:document.querySelector('h1')?.textContent.trim(),
    fontLoaded:document.fonts.check('400 16px "IBM Plex Sans"'),
    canvasSize:(()=>{const c=document.querySelector('canvas.fiber-field');return [c?.width,c?.height]})(),
    canvasPixels:(()=>{const c=document.querySelector('canvas.fiber-field');if(!c)return 0;const data=c.getContext('2d').getImageData(Math.floor(c.width*.72),Math.floor(c.height*.45),10,10).data;return [...data].filter(x=>x>0).length})(),
    heroHeight:Math.round(document.querySelector('.hero-immersive')?.getBoundingClientRect().height||0),
    sections:[...document.querySelectorAll('section[id]')].length,
    aLink:document.querySelector('.concept-options a:first-child')?.getAttribute('href'),
    bActive:document.querySelector('.concept-options a[aria-current="page"]')?.getAttribute('href'),
    servicesCount:document.querySelectorAll('.services-grid .service').length,
    galleryImages:document.querySelectorAll('.gallery-strip img').length,
    formPresent:!!document.getElementById('contactForm'),
    stable:!!document.querySelector('meta[content="noindex,nofollow,noarchive"]')
   }));
   assert.equal(info.lang,locale.name);
   assert.equal(info.pageWidth,size.w,'horizontal overflow');
   assert.ok(info.canvasSize[0]>0&&info.canvasSize[1]>0,'Canvas not sized');
   assert.ok(info.canvasPixels>0,'Canvas not painted');
   assert.ok(info.heroHeight>480,'Hero too short');
   assert.equal(info.aLink,locale.a);assert.equal(info.bActive,locale.b);
   assert.equal(info.fontLoaded,true);assert.equal(info.servicesCount,4);assert.equal(info.galleryImages,4);
   assert.ok(info.formPresent&&info.stable);assert.deepEqual(errors,[]);
   if(locale.name==='de'){
    await page.screenshot({path:`docs/screenshots/terraFIBER-conceptB-${size.name}.png`,fullPage:false,animations:'disabled'});
   }
   console.log(locale.name+' '+size.name,JSON.stringify({...info,errors}));
   await ctx.close();
  }
  // Original A version still offers the correct link to B.
  const ctx=await browser.newContext();
  const page=await ctx.newPage();
  await page.goto(ROOT+locale.a,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.concept-options a:nth-child(2)').getAttribute('href'),locale.b);
  assert.ok(await page.locator('.hero-art .map-diagram').count()===1,'Original map must remain');
  await ctx.close();
 }
 // Static reduced-motion illustration must still be painted.
 const ctx=await browser.newContext({reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(ROOT+'/concept-b/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(400);
 const staticOk=await page.locator('canvas.fiber-field').evaluate(c=>c.width>0&&c.getContext('2d').getImageData(c.width/2|0,c.height/2|0,1,1).data[3]>0);
 assert.equal(staticOk,true);
 console.log('Reduced-motion canvas: visible static artwork');
 await ctx.close();
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
