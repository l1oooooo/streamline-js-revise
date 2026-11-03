export const profiles = ['Londinium', 'Adaptive v2', 'Blooming espresso', 'Rao Allongé  DA Earthworld o.bourbon', 'Default'];
export const directions = ['current', 'studio', 'sequence', 'panorama'];
const params = new URLSearchParams(location.search);
export const state = {
  view: ['home','brewing','review'].includes(params.get('view')) ? params.get('view') : 'home',
  scenario: ['standard','long','empty','offline'].includes(params.get('scenario')) ? params.get('scenario') : 'standard',
  theme: params.get('theme') === 'dark' ? 'dark' : 'light',
  profile: 0, dose: 20, drink: 46, grind: 1.4, temp: 92, elapsed: 18.4,
  running: false, compare: true, selectedShot: 0, ready: [false,false], taste: 'Balanced',
  steam: 30, flush: 5, water: 150, heater: true, tool: '', notice: '', expanded: false,
};
if(state.scenario==='long') state.profile=3;
export const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function title() { return profiles[state.profile]; }
export function readings(t = state.elapsed) {
  return {
    time: t.toFixed(1),
    weight: Math.max(0, (t - 5.5) / 25.9 * state.drink).toFixed(1),
    pressure: (t < 5 ? t * .6 : t < 9 ? 3 + (t - 5) * 1.5 : Math.max(5, 9 - (t-9) * .08)).toFixed(1),
    flow: (t < 5 ? 4.5 : t < 9 ? 3.5 - (t-5)*.4 : 1.7 + Math.sin(t*.4)*.2).toFixed(1),
    temp: (state.temp - .3 + Math.sin(t*.3)*.2).toFixed(1),
  };
}
export function curve(key, end = 34, reference = false) {
  const points=[];
  for (let t=0;t<=Math.min(end,34);t+=.25) {
    const r=readings(t + (reference ? .6 + state.selectedShot % 6 * .25 : 0));
    let value=Number(r[key]);
    if (reference) value *= key === 'weight' ? .96 : 1.035;
    const normalized = key === 'pressure' ? value/12 : key === 'flow' ? value/7 : key === 'weight' ? value/(state.drink*1.2) : (value-85)/12;
    points.push(`${points.length?'L':'M'}${(52+t/35*820).toFixed(1)},${(290-Math.min(1,Math.max(0,normalized))*250).toFixed(1)}`);
  }
  return points.join(' ');
}
export function setView(view) {
  state.view=view;
  state.running=false;
  if(view==='brewing') state.elapsed=18.4;
  if(view==='review') state.elapsed=31.4;
  parent.postMessage({type:'decaid-proto-view',view},location.origin);
}
export function adjust(field, delta) {
  const bounds={dose:[5,30], drink:[5,150],grind:[.1,10],temp:[75,98],steam:[5,90],flush:[1,30],water:[25,500]};
  if(!bounds[field] || !Number.isFinite(delta)) return;
  state[field]=Math.round(Math.min(bounds[field][1],Math.max(bounds[field][0],state[field]+delta))*10)/10;
}
export function fit(canvas) {
  const resize=()=>{
    const scale=Math.min(innerWidth/1340,innerHeight/800);
    canvas.style.width=innerWidth/scale+'px'; canvas.style.height=innerHeight/scale+'px';
    canvas.style.transform=`scale(${scale})`;
  };
  resize(); window.addEventListener('resize',resize);
  document.addEventListener('keydown',e=>{
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable||e.metaKey||e.ctrlKey||e.altKey)return;
    if(['1','2','3','4','ArrowLeft','ArrowRight','r','R'].includes(e.key)&&parent!==window){
      e.preventDefault();parent.postMessage({type:'decaid-proto-key',key:e.key},location.origin);
    }
  });
}
export function runClock(update, finish) {
  let previous=performance.now();
  const id=setInterval(()=>{
    const now=performance.now(); const delta=(now-previous)/1000; previous=now;
    if(!state.running || document.hidden) return;
    state.elapsed=Math.min(31.4,state.elapsed+delta);
    update();
    if(state.elapsed>=31.4) { state.running=false; setView('review'); finish(); }
  },200);
  window.addEventListener('pagehide',()=>clearInterval(id),{once:true});
}
