const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 fs.mkdirSync('docs/references',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('console',m=>console.log('CONSOLE '+m.type()+' '+m.text().slice(0,180)));
 page.on('pageerror',e=>console.log('JS ERROR '+e.message));
 const r=await page.goto('https://geoexpert-aes.pages.dev/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(4200);
 const report=await page.evaluate(()=>{
  const els=[...document.querySelectorAll('header,main,section,canvas,video,svg,h1,h2,a,button')].filter(el=>{const b=el.getBoundingClientRect();return b.width>0&&b.height>0&&b.top<1000;}).slice(0,70);
  return {
   title:document.title,meta:document.querySelector('meta[name=description]')?.content,url:location.href,width:document.documentElement.scrollWidth,
   headings:[...document.querySelectorAll('h1,h2')].slice(0,12).map(x=>x.textContent.trim()),
   paragraphs:[...document.querySelectorAll('main p,section p')].slice(0,15).map(x=>x.textContent.trim().slice(0,220)),
   visible:els.map(el=>{const st=getComputedStyle(el),b=el.getBoundingClientRect();return {tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,90):'',id:el.id,text:el.textContent?.trim().slice(0,80),xywh:[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)],background:st.backgroundColor,backgroundImage:st.backgroundImage.slice(0,170),color:st.color,font:st.fontFamily,position:st.position}}),
   animated:[...document.querySelectorAll('*')].filter(el=>getComputedStyle(el).animationName!=='none').slice(0,30).map(x=>({tag:x.tagName,cl:typeof x.className==='string'?x.className:'',animation:getComputedStyle(x).animationName})),
   canvas:[...document.querySelectorAll('canvas,video')].map(x=>({type:x.tagName,id:x.id,cl:x.className})),
   scriptSrc:[...document.scripts].map(x=>x.src||'[inline]').slice(0,25)
  };
 });
 fs.writeFileSync('docs/references/geoexpert-report.json',JSON.stringify(report,null,2));
 await page.screenshot({path:'docs/references/geoexpert-home-desktop.png',fullPage:false});
 await page.setViewportSize({width:375,height:812});
 await page.waitForTimeout(900);
 await page.screenshot({path:'docs/references/geoexpert-home-mobile.png',fullPage:false});
 console.log('INSPECTION SUMMARY '+JSON.stringify({status:r.status(),title:report.title,headings:report.headings,canvas:report.canvas,animated:report.animated,scriptSrc:report.scriptSrc}).slice(0,4200));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
