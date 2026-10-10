/* terraFIBER Konzept B — calm interactive fibre-field visualization.
   Custom Canvas2D dot mesh, no libraries or external assets. */
(function(){
 'use strict';
 const canvas=document.querySelector('.hero-immersive .fiber-field');
 const hero=document.querySelector('.hero-immersive');
 if(!canvas||!hero)return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const pointer={x:.78,y:.43,targetX:.78,targetY:.43};
 let w=0,h=0,dpr=1,columns=0,rows=0,dots=[],last=0,elapsed=0,raf=0,visible=false,playing=false;
 let resizeObserver=null,intersectionObserver=null;
 function random(i,j){const val=Math.sin(i*127.1+j*311.7+19.8)*43758.5453;return val-Math.floor(val)}
 function resize(){
  const box=canvas.getBoundingClientRect();
  w=Math.max(1,Math.round(box.width));h=Math.max(1,Math.round(box.height));
  dpr=Math.min(window.devicePixelRatio||1,1.7);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const narrow=w<600;
  columns=narrow?34:62;rows=narrow?24:33;dots=[];
  for(let r=0;r<rows;r++){
   const strip=[];
   for(let c=0;c<columns;c++){
    const x=c/(columns-1),y=r/(rows-1);
    strip.push({x:x,y:y,noise:random(c,r),twinkle:random(r+17,c+7)});
   }
   dots.push(strip);
  }
  draw();
 }
 function point(dot,t){
  const xx=dot.x,yy=dot.y;
  const dx=(pointer.x-.5)*(w<600?3:9),dy=(pointer.y-.5)*(w<600?2:5);
  // Subtle diagonal contour waves, not a technical claim about any real location.
  const swell=Math.sin(xx*13.4+yy*4.6+t*.18)*.045+
    Math.cos(xx*7.1-yy*10.5-t*.09)*.018;
  const wide=(xx*.94+.06);
  return {x:w*(xx*1.13-.06)+dx*wide,
    y:h*(yy*.94+.03+swell*(.42+wide*.55))+dy*wide};
 }
 function draw(){
  if(!w||!h)return;
  ctx.clearRect(0,0,w,h);
  const t=reduced.matches?4.2:elapsed*.001;
  // Deep matte background, subtle warm blue illumination on the right.
  const bg=ctx.createRadialGradient(w*.79,h*.45,0,w*.72,h*.45,w*.79);
  bg.addColorStop(0,'#142b3b');bg.addColorStop(.55,'#0b1d2b');bg.addColorStop(1,'#071522');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  pointer.x+=(pointer.targetX-pointer.x)*.035;
  pointer.y+=(pointer.targetY-pointer.y)*.035;
  const lines=[];
  const meshT=t*.34;
  for(let r=0;r<rows;r++){
   const points=[];
   for(let c=0;c<columns;c++)points.push(point(dots[r][c],meshT));
   lines.push(points);
  }
  // Thin contour lines and a woven point cloud. Not a glowing neon network.
  ctx.lineWidth=.6;
  for(let r=0;r<rows;r+=3){
   ctx.strokeStyle='rgba(153,185,206,.09)';
   ctx.beginPath();
   for(let c=0;c<columns;c++){
    const p=lines[r][c];if(c===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.stroke();
  }
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
   const p=lines[r][c],dot=dots[r][c];
   const depth=.45+.55*dot.noise;
   const opacity=(w<600?.08:.11)+(w<600?.15:.19)*depth;
   ctx.fillStyle='rgba(197,215,224,'+opacity.toFixed(3)+')';
   ctx.beginPath();ctx.arc(p.x,p.y,dot.noise>.87?1.22:.77,0,Math.PI*2);ctx.fill();
  }
  // A few intentional FTTH data paths, with a single travelling white signal.
  const paths=[{row:8,left:18,right:56},{row:16,left:20,right:60},{row:25,left:24,right:59}];
  paths.forEach((path,k)=>{
   if(path.row>=rows)return;
   const left=Math.min(path.left,columns-2),right=Math.min(path.right,columns-1);
   ctx.beginPath();
   for(let c=left;c<=right;c++){
    const p=lines[path.row][c];if(c===left)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.lineWidth=1.2;ctx.strokeStyle='rgba(74,155,234,.42)';ctx.stroke();
   const phase=((t/(9+k*1.7))+k*.31)%1;
   const at=left+Math.floor((right-left)*phase);
   const p=lines[path.row][at];
   if(p){
    ctx.beginPath();ctx.fillStyle='rgba(255,255,255,.82)';
    ctx.arc(p.x,p.y,1.9,0,Math.PI*2);ctx.fill();
   }
  });
 }
 function frame(now){
  if(!playing)return;
  const delta=last?Math.min(now-last,72):0;last=now;elapsed+=delta;
  if(delta===0||delta>=28)draw();
  raf=requestAnimationFrame(frame);
 }
 function update(){
  if(reduced.matches||!visible||document.hidden){
   playing=false;cancelAnimationFrame(raf);last=0;draw();return;
  }
  if(!playing){playing=true;last=0;raf=requestAnimationFrame(frame)}
 }
 hero.addEventListener('pointermove',function(event){
  const rect=hero.getBoundingClientRect();
  pointer.targetX=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
  pointer.targetY=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
 },{passive:true});
 hero.addEventListener('pointerleave',function(){pointer.targetX=.78;pointer.targetY=.43;},{passive:true});
 if('IntersectionObserver' in window){
  intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update()},{threshold:.08});
  intersectionObserver.observe(hero);
 }else visible=true;
 if('ResizeObserver' in window){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas)}
 else window.addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',update);
 if(reduced.addEventListener)reduced.addEventListener('change',update);
 else if(reduced.addListener)reduced.addListener(update);
 resize();update();
})();
