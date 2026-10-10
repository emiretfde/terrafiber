/* Single optical signal across the top-down neighborhood SVG.
   Adjust travel, pause, reset and node-breathe (CSS) for fine-tuning. */
(function(){
'use strict';
var root=document.querySelector('.hero-art'),canvas=root&&root.querySelector('.neighborhood-map');
var pulse=document.getElementById('map-light-pulse');
if(!root||!canvas||!pulse||!window.requestAnimationFrame)return;
var homes=Array.prototype.slice.call(root.querySelectorAll('.map-connected'));
var routes=homes.map(function(_,i){return document.getElementById('map-route-'+i)});
if(homes.length!==10||routes.some(function(p){return !p||!p.getTotalLength}))return;
var len=routes.map(function(p){return p.getTotalLength()});
var travel=7000,pause=2500,reset=2000,interval=travel+pause,cycle=interval*homes.length+reset;
var media=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
var inView=false,running=false,frameId=null,last=null,clock=0,currentStep=-1,resetting=false;
function showStatic(){pulse.setAttribute('opacity','0');canvas.classList.remove('is-resetting');homes.forEach(function(h){h.classList.add('is-active')})}
function draw(){
  var time=clock%cycle,isReset=time>=interval*homes.length;
  if(isReset){
    if(!resetting){canvas.classList.add('is-resetting');homes.forEach(function(h){h.classList.remove('is-active')})}
    pulse.setAttribute('opacity','0');resetting=true;currentStep=-1;return;
  }
  if(resetting){canvas.classList.remove('is-resetting');resetting=false}
  var step=Math.floor(time/interval),within=time-step*interval;
  if(step!==currentStep){homes.forEach(function(h,i){h.classList.toggle('is-active',i<step)});currentStep=step}
  if(within>=travel){pulse.setAttribute('opacity','0');homes[step].classList.add('is-active');return}
  var t=within/travel,ease=t*t*(3-2*t);
  var pt=routes[step].getPointAtLength(len[step]*ease);
  pulse.setAttribute('transform','translate('+pt.x.toFixed(2)+' '+pt.y.toFixed(2)+')');
  pulse.setAttribute('opacity','1');
}
function tick(now){if(!running)return;if(last!==null)clock+=now-last;last=now;draw();frameId=requestAnimationFrame(tick)}
function stop(){if(running){cancelAnimationFrame(frameId);running=false}last=null;root.classList.add('is-paused')}
function update(){
  if(media&&media.matches){stop();showStatic();return}
  if(!inView||document.hidden){stop();return}
  if(running)return;
  root.classList.remove('is-paused');running=true;last=null;frameId=requestAnimationFrame(tick);
}
if('IntersectionObserver' in window){
  var obs=new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;update()},{threshold:.12});
  obs.observe(root);
}else inView=true;
document.addEventListener('visibilitychange',update);
if(media){
  var onChange=function(){if(!media.matches){clock=0;currentStep=-1;resetting=false;homes.forEach(function(h){h.classList.remove('is-active')})}update()};
  if(media.addEventListener)media.addEventListener('change',onChange);
  else if(media.addListener)media.addListener(onChange);
}
update();
})();
