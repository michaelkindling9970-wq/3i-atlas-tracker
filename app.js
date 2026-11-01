(async()=>{
const T=await (await fetch('data/traj.json')).json(), PINS=(await (await fetch('data/pins.json')).json()).sort((a,b)=>a.t<b.t?-1:1);
const MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const pd=s=>Date.UTC(+s.slice(0,4),MON[s.slice(5,8)],+s.slice(9,11));
for(const k in T)T[k]=T[k].map(r=>[pd(r[0]),r[1],r[2],r[3]]);
const A=T.atlas,t0=A[0][0],t1=A[A.length-1][0],DAY=864e5,TODAY=Date.UTC(2026,10,1),LASTOBS=Date.UTC(2026,9,16);
const START=Date.UTC(2025,0,1),END=Date.UTC(2029,6,1);
function pos(arr,t){const i=Math.max(0,Math.min(arr.length-2,Math.floor((t-arr[0][0])/(arr[1][0]-arr[0][0])))),a=arr[i],b=arr[i+1],f=(t-a[0])/(b[0]-a[0]);return[a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f]}
const rr=p=>Math.hypot(p[0],p[1],p[2]);const AUKM=149597870.7;
function spd(t){const a=pos(A,t-DAY/2),b=pos(A,t+DAY/2);return Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])*AUKM/86400}
PINS.forEach(p=>{p.ms=Date.parse(p.t.length>10?p.t+':00Z':p.t+'T12:00:00Z');p.p=pos(A,p.ms)});
// stats
const pt=pos(A,TODAY),S=[
['Discovered','Jul 1, 2025','ATLAS telescope, Rio Hurtado, Chile (pre-discovery images to Jun 14)',1],
['Eccentricity','6.12','Hyperbolic (e>1) · JPL#55'],['Inclination','175.2°','Retrograde, ~5° from ecliptic'],
['Perihelion','Oct 29, 2025','~10:36 UT (TDB)'],['Perihelion dist.','1.35 au','~202 million km, inside Mars orbit'],
['Inbound speed','≈58 km/s','v∞ far from Sun (Horizons)'],['Perihelion speed','≈68.3 km/s','~246,000 km/h'],
['Closest to Mars','Oct 3, 2025','0.194 au · ~29 M km'],['Closest to Earth','Dec 19, 2025','1.80 au · ~269 M km'],
['Closest to Jupiter','Mar 16, 2026','0.358 au · ~53.6 M km'],['Nucleus size (est.)','~0.44–5.6 km','Hubble limits; NGA-based r ≲ 0.37 km'],
['Age (model est.)','>7.6 billion yr','Hopkins et al. 2025, 68% range 7.6–14 Gyr'],['Came from','Sagittarius','Inbound radiant, toward galactic center'],['Heading to','Gemini','Outbound direction'],
['Distance from Sun today',rr(pt).toFixed(2)+' au',(rr(pt)*AUKM/1e9).toFixed(2)+' billion km · Nov 1, 2026'],['Speed today',spd(TODAY).toFixed(1)+' km/s','Heliocentric, outbound']];
document.getElementById('stats').innerHTML=S.map(s=>`<div class="st ${s[3]||s[0].includes('today')?'wide':''}"><small>${s[0]}</small><b>${s[1]}</b><small>${s[2]}</small></div>`).join('');
document.getElementById('pc').textContent=PINS.length;
const fmt=ms=>new Date(ms).toISOString().slice(0,10);
const pinDate=p=>{const d=new Date(p.ms);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})+(p.t.length>10?' · '+p.t.slice(11,16)+' UTC':'')}
const feed=document.getElementById('feed');feed.innerHTML=PINS.map((p,i)=>`<div data-i="${i}"><b>${pinDate(p).split(' ·')[0]}</b> — ${p.title}</div>`).join('');
// canvas
const cv=document.getElementById('cv'),cx=cv.getContext('2d'),tip=document.getElementById('tip');let W,H,DPR,zoom=1,pan=[0,0];
function rs(){DPR=devicePixelRatio||1;W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR}addEventListener('resize',rs);rs();
const sc=()=>Math.min(W,H)/2/Math.sqrt(16)*zoom;
function P(p){const r=Math.hypot(p[0],p[1])||1e-9,k=Math.sqrt(r)/r*sc();return[W/2+pan[0]+p[0]*k,H/2+pan[1]-p[1]*k]}
const PL={Mercury:['#b9b9b9',2],Venus:['#f1d39a',3],Earth:['#5aa9ff',3.5],Mars:['#ff6a4a',3],Jupiter:['#e6b37a',6],Saturn:['#e8d39a',5]};
const stars=[...Array(260)].map(()=>[Math.random(),Math.random(),Math.random()]);
let t=START,playing=true,rate=7,last=performance.now(),hover=null,sel=null,pinXY=[];
const scrub=document.getElementById('scrub');
function draw(now){const dt=(now-last)/1000;last=now;if(playing){t+=dt*rate*DAY;if(t>END)t=START}
scrub.value=(t-START)/(END-START)*1000;
cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
for(const s of stars){cx.fillStyle=`rgba(200,210,255,${.15+.5*s[2]*(0.7+0.3*Math.sin(now/900+s[0]*50))})`;cx.fillRect(s[0]*W,s[1]*H,1.2,1.2)}
// rings
cx.strokeStyle='#1a2148';cx.fillStyle='#3a4378';cx.font='10px system-ui';
for(const r of [1,2,5,10,15,20]){const k=Math.sqrt(r)*sc();cx.beginPath();cx.setLineDash([2,4]);cx.arc(W/2+pan[0],H/2+pan[1],k,0,7);cx.stroke();cx.setLineDash([]);cx.fillText(r+' au',W/2+pan[0]+k+3,H/2+pan[1]-3)}
// planets orbits & bodies
for(const n in PL){const arr=T[n],per={Mercury:88,Venus:225,Earth:365,Mars:687,Jupiter:4333,Saturn:10759}[n];cx.strokeStyle=PL[n][0]+'44';cx.beginPath();
 const n0=Math.min(arr.length,Math.ceil(per/3)+1);for(let i=0;i<n0;i++){const q=P(arr[i].slice(1));i?cx.lineTo(...q):cx.moveTo(...q)}cx.stroke();
 const q=P(pos(arr,t));cx.fillStyle=PL[n][0];cx.beginPath();cx.arc(q[0],q[1],PL[n][1],0,7);cx.fill();cx.fillStyle='#8a93c2';cx.fillText(n,q[0]+7,q[1]-5)}
// sun
const sg=cx.createRadialGradient(W/2+pan[0],H/2+pan[1],0,W/2+pan[0],H/2+pan[1],22);sg.addColorStop(0,'#fff6c0');sg.addColorStop(.3,'#ffd34d');sg.addColorStop(1,'#ffd34d00');cx.fillStyle=sg;cx.beginPath();cx.arc(W/2+pan[0],H/2+pan[1],22,0,7);cx.fill();
// full path faint
cx.strokeStyle='#4fe3ff22';cx.lineWidth=1;cx.beginPath();A.forEach((r,i)=>{const q=P(r.slice(1));i?cx.lineTo(...q):cx.moveTo(...q)});cx.stroke();
// flown trail (up to t)
cx.lineWidth=2.2;cx.beginPath();let first=true;for(const r of A){if(r[0]>t)break;if(r[0]>LASTOBS&&!first){cx.stroke();cx.setLineDash([6,5]);cx.beginPath();cx.moveTo(...P(r.slice(1)));first=true;continue}const q=P(r.slice(1));first?cx.moveTo(...q):cx.lineTo(...q);first=false}
const g=cx.createLinearGradient(0,0,W,H);cx.strokeStyle='#4fe3ff';cx.stroke();cx.setLineDash([]);
// projected outbound
cx.strokeStyle='#4fe3ff66';cx.setLineDash([3,6]);cx.beginPath();let st=false;for(const r of A){if(r[0]<Math.max(t,TODAY))continue;const q=P(r.slice(1));st?cx.lineTo(...q):cx.moveTo(...q);st=true}cx.stroke();cx.setLineDash([]);cx.lineWidth=1;
// origin arrow label
const o=P(A[0].slice(1));cx.fillStyle='#8a93c2';cx.fillText('← from interstellar space (Sagittarius)',Math.max(4,Math.min(W-220,o[0])),Math.max(14,Math.min(H-60,o[1])));
const e=P(A[A.length-1].slice(1));cx.fillText('exit toward Gemini →',Math.max(4,Math.min(W-130,e[0]-60)),Math.max(14,Math.min(H-60,e[1])));
// today marker
const ty=P(pos(A,TODAY)),pul=6+3*Math.sin(now/300);cx.strokeStyle='#7dff9b';cx.lineWidth=2;cx.beginPath();cx.arc(ty[0],ty[1],pul+4,0,7);cx.stroke();cx.lineWidth=1;cx.fillStyle='#7dff9b';cx.fillText('YOU ARE HERE TODAY · Nov 1 2026',ty[0]+14,ty[1]+4);
// pins
pinXY=[];PINS.forEach((p,i)=>{if(p.ms>t)return;const age=(t-p.ms)/DAY/rate,s=Math.min(1,age*3);const q=P(p.p),bob=Math.sin(now/500+i)*1.5;const sz=(hover===i||sel===i?9:6)*(s<1?1+Math.sin(s*Math.PI)*.8:1)*s;
 cx.strokeStyle='#ff7a3c88';cx.beginPath();cx.moveTo(q[0],q[1]);cx.lineTo(q[0],q[1]-16*s+bob);cx.stroke();
 cx.fillStyle=hover===i||sel===i?'#ffd0a8':'#ff7a3c';cx.beginPath();cx.arc(q[0],q[1]-16*s+bob,sz,0,7);cx.fill();
 if(s<1){cx.strokeStyle=`rgba(255,122,60,${1-s})`;cx.beginPath();cx.arc(q[0],q[1],30*s,0,7);cx.stroke()}
 pinXY.push([i,q[0],q[1]-16*s+bob])});
// comet
if(t>=t0&&t<=t1){const c=pos(A,t),q=P(c);const ang=Math.atan2(q[1]-H/2-pan[1],q[0]-W/2-pan[0]),near=rr(c)<4?1-rr(c)/4:0;
 const tg=cx.createLinearGradient(q[0],q[1],q[0]+Math.cos(ang)*60*(.4+near),q[1]+Math.sin(ang)*60*(.4+near));tg.addColorStop(0,'#9ff3ffcc');tg.addColorStop(1,'#9ff3ff00');cx.strokeStyle=tg;cx.lineWidth=4;cx.beginPath();cx.moveTo(...q);cx.lineTo(q[0]+Math.cos(ang)*60*(.4+near),q[1]+Math.sin(ang)*60*(.4+near));cx.stroke();cx.lineWidth=1;
 const cg=cx.createRadialGradient(q[0],q[1],0,q[0],q[1],12);cg.addColorStop(0,'#fff');cg.addColorStop(.3,'#4fe3ff');cg.addColorStop(1,'#4fe3ff00');cx.fillStyle=cg;cx.beginPath();cx.arc(q[0],q[1],12,0,7);cx.fill();
 cx.fillStyle='#dfe6ff';cx.fillText('3I/ATLAS',q[0]+12,q[1]+14);
 document.getElementById('live').textContent=`${rr(c).toFixed(2)} au from Sun · ${spd(t).toFixed(1)} km/s${t>LASTOBS?' · projected':''}`}
document.getElementById('date').textContent=fmt(t);
requestAnimationFrame(draw)}
requestAnimationFrame(draw);
function show(i,x,y){const p=PINS[i];tip.innerHTML=`<span class="x">✕</span><div class="d">${pinDate(p)} · ${p.src}</div><h3>${p.title}</h3><div>${p.text}</div><p><a href="${p.url}" target="_blank" rel="noopener">Read source ↗</a></p>`;tip.style.display='block';
 const r=cv.getBoundingClientRect();tip.style.left=Math.min(r.width-330,Math.max(6,x+14))+'px';tip.style.top=Math.min(r.height-200,Math.max(6,y-20))+'px';tip.querySelector('.x').onclick=()=>{tip.style.display='none';sel=null}}
function hit(e){const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let b=null,bd=14;for(const [i,px,py] of pinXY){const d=Math.hypot(px-x,py-y);if(d<bd){bd=d;b=i}}return[b,x,y]}
let drag=null;cv.onpointerdown=e=>{const [i,x,y]=hit(e);if(i!==null){sel=i;show(i,x,y)}else drag=[e.clientX,e.clientY,...pan]};
addEventListener('pointerup',()=>drag=null);cv.onpointermove=e=>{if(drag){pan=[drag[2]+e.clientX-drag[0],drag[3]+e.clientY-drag[1]];return}const [i,x,y]=hit(e);hover=i;cv.style.cursor=i!==null?'pointer':'grab';if(i!==null&&sel===null)show(i,x,y);else if(i===null&&sel===null)tip.style.display='none'};
cv.onwheel=e=>{e.preventDefault();zoom*=e.deltaY<0?1.12:1/1.12;zoom=Math.max(.4,Math.min(8,zoom))};
feed.onclick=e=>{const d=e.target.closest('div[data-i]');if(!d)return;const i=+d.dataset.i,p=PINS[i];t=p.ms+DAY*2;playing=false;pb.textContent='▶ Play';sel=i;setTimeout(()=>{const q=pinXY.find(z=>z[0]===i);if(q)show(i,q[1],q[2])},60)};
const pb=document.getElementById('play');pb.onclick=()=>{playing=!playing;pb.textContent=playing?'⏸ Pause':'▶ Play'};
document.getElementById('spd').onchange=e=>rate=+e.target.value;scrub.oninput=()=>{t=START+(END-START)*scrub.value/1000};
document.getElementById('today').onclick=()=>{t=TODAY;playing=false;pb.textContent='▶ Play'};
document.getElementById('zin').onclick=()=>zoom=Math.min(8,zoom*1.3);document.getElementById('zout').onclick=()=>zoom=Math.max(.4,zoom/1.3);
setInterval(()=>{[...feed.children].forEach((d,i)=>d.className=PINS[i].ms<=t?'on':'off')},300);
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;const b=document.getElementById('inst');b.style.display='inline-block';b.onclick=ev=>{ev.preventDefault();dp.prompt()}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
})();
