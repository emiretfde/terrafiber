const {chromium}=require('playwright');
const fs=require('fs');
const assert=require('node:assert/strict');
const ROOT='http://127.0.0.1:8123';
(async()=>{
 fs.mkdirSync('docs/screenshots',{recursive:true});
 const GL=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
 const browser=await chromium.launch({headless:true,args:GL});
 for(const locale of [{name:'de',a:'/',b:'/concept-b/'},{name:'en',a:'/en/',b:'/concept-b/en/'},{name:'nl',a:'/nl/',b:'/concept-b/nl/'}]){
  for(const size of [{name:'desktop',w:1440,h:900},{name:'mobile',w:375,h:812}]){
   const ctx=await browser.newContext({viewport:{width:size.w,height:size.h},deviceScaleFactor:1});
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(ROOT+locale.b,{waitUntil:'domcontentloaded',timeout:30000});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(2600);
   const info=await page.evaluate(()=>({
    lang:document.documentElement.lang,
    pageWidth:document.documentElement.scrollWidth,innerWidth:innerWidth,
    title:document.querySelector('h1')?.textContent.trim(),
    fontLoaded:document.fonts.check('400 16px "IBM Plex Sans"'),
    canvasSize:(()=>{const c=document.querySelector('canvas.fiber-field');return [c?.width,c?.height]})(),
    heroMode:window.__tfHero&&window.__tfHero.mode,
    heroFrames:window.__tfHero&&window.__tfHero.frames,
    canvasPixels:window.__tfHero&&window.__tfHero.sample?window.__tfHero.sample():0,
    legend:!!document.querySelector('.terrain-legend'),
    h1Visible:(()=>{const r=document.querySelector('h1').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+200})(),
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
   assert.equal(info.heroMode,'webgl','WebGL terrain did not start');
   assert.ok(info.heroFrames>3,'Terrain not animating');
   assert.ok(info.canvasPixels>0.01,'Terrain not painted');
   assert.ok(info.legend&&info.h1Visible);
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
 // Konzept C: GeoExpert-style point cloud, all locales and sizes.
 for(const locale of [{name:'de',a:'/',c:'/concept-c/'},{name:'en',a:'/en/',c:'/concept-c/en/'},{name:'nl',a:'/nl/',c:'/concept-c/nl/'}]){
  for(const size of [{w:1440,h:900},{w:375,h:812}]){
   const ctx=await browser.newContext({viewport:{width:size.w,height:size.h}});
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(ROOT+locale.c,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(2600);
   const info=await page.evaluate(()=>({lang:document.documentElement.lang,pageWidth:document.documentElement.scrollWidth,
    mode:__tfHero.mode,frames:__tfHero.frames,lit:__tfHero.sample(),readout:document.getElementById('o-y').textContent,
    active:document.querySelector('.concept-options a[aria-current="page"]')?.getAttribute('href'),
    options:document.querySelectorAll('.concept-options a').length,
    servicesCount:document.querySelectorAll('.services-grid .service').length,formPresent:!!document.getElementById('contactForm')}));
   assert.equal(info.lang,locale.name);assert.equal(info.pageWidth,size.w,'horizontal overflow');
   assert.equal(info.mode,'webgl');assert.ok(info.frames>3);assert.ok(info.lit>0.01,'Point cloud not painted');
   assert.ok(/\d/.test(info.readout),'Readout not updating');assert.equal(info.active,locale.c);assert.equal(info.options,3);
   assert.equal(info.servicesCount,4);assert.ok(info.formPresent);assert.deepEqual(errors,[]);
   console.log('C '+locale.name+' '+size.w,JSON.stringify(info));
   await ctx.close();
  }
 }
 // Reduced motion: one still frame, no animation loop.
 {
  const ctx=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  await page.goto(ROOT+'/concept-b/',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1500);
  const a=await page.evaluate(()=>window.__tfHero.frames);
  await page.waitForTimeout(1200);
  const r=await page.evaluate(()=>({mode:__tfHero.mode,frames:__tfHero.frames,lit:__tfHero.sample()}));
  assert.equal(r.mode,'webgl');assert.ok(r.lit>0.01,'Reduced-motion frame not painted');
  assert.ok(r.frames-a<=2,'Animation keeps running with reduced motion');
  console.log('Reduced motion: static frame',JSON.stringify(r));
  await ctx.close();
 }
 // No WebGL: static Canvas2D fallback of the same terrain, no errors.
 {
  const b2=await chromium.launch({headless:true,args:['--no-sandbox','--disable-webgl','--disable-3d-apis']});
  const page=await b2.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(ROOT+'/concept-b/',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1200);
  const r=await page.evaluate(()=>{const c=document.querySelector('canvas.fiber-field');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return {mode:__tfHero.mode,lit:n/(c.width*c.height)}});
  assert.equal(r.mode,'canvas2d');assert.ok(r.lit>0.005,'Fallback not painted');assert.deepEqual(errors,[]);
  console.log('No-WebGL fallback',JSON.stringify(r));
  await b2.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
