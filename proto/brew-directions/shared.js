import { state, title, profiles, esc, readings, curve } from './model.js';
export const label = text => `<span class="eyebrow">${text}</span>`;
export function button(text, action, cls='', attrs='') {
  return `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${text}</button>`;
}
export function profileSelect() {
  return `<label class="profile-select"><span class="sr-only">Profile</span><select data-profile aria-label="Profile">${profiles.map((p,i)=>`<option value="${i}" ${(state.scenario==='long'?3:state.profile)===i?'selected':''}>${esc(p)}</option>`).join('')}</select></label>`;
}
export function metric(field, name, unit, step) {
  const value=state[field].toFixed(field==='grind'?1:0);
  return `<div class="recipe-field"><div>${label(name)}<div class="recipe-value"><span data-field="${field}">${value}</span><span class="unit">${unit}</span></div></div><div class="steppers">${button('−','adjust','step',`data-field="${field}" data-delta="${-step}" aria-label="Decrease ${name.toLowerCase()}"`)}${button('+','adjust','step',`data-field="${field}" data-delta="${step}" aria-label="Increase ${name.toLowerCase()}"`)}</div></div>`;
}
export function recipe() { return `<div class="recipe-fields">${metric('grind','Grind','',.1)}${metric('dose','Dose','g',1)}${metric('drink','Drink','g',2)}${metric('temp','Brew','°C',1)}</div>`; }
export function status() { return state.scenario==='offline' ? '<span class="connection offline">× Disconnected</span>' : `<span class="connection"><i></i>${state.view==='brewing'?'Extracting':state.view==='review'?'Shot complete':'Ready to brew'}</span>`; }
export function header(extra='') {
  return `<header class="app-header"><span class="brand">decaid<span class="brand-divider"></span><span class="device">DE1</span></span>${extra}<div class="header-end">${status()}<span class="header-temp">92.0°C</span>${button('Shot history','history','ghost')}${button('Machine tools','tools','ghost')}</div></header>`;
}
export function action() {
  if(state.scenario==='offline') return button('Reconnect','reconnect','primary');
  if(state.view==='brewing') return `<div class="brew-actions">${button(state.running?'Pause':'Resume','pause','secondary', 'aria-label="Pause or resume simulation"')}${button('Stop shot','stop','stop')}</div>`;
  if(state.view==='review') return button('Prepare next shot ↗','next','primary');
  return '';
}
export function telemetry(big=false) {
  const r=readings(state.view==='home'?31.4:state.elapsed);
  const values=[['pressure','Pressure',r.pressure,'bar'],['flow','Flow',r.flow,'ml/s'],['temp','Temperature',r.temp,'°C'],['weight','Weight',r.weight,'g']];
  return `<div class="telemetry ${big?'large':''}">${values.map(([key,name,value,unit])=>`<div class="telemetry-cell ${key}">${label(name)}<div><span data-live="${key}">${value}</span><small>${unit}</small></div></div>`).join('')}</div>`;
}
export function chart({small=false,compare=false}={}) {
  const end=state.view==='home'||state.view==='review'?31.4:state.elapsed;
  return `<div class="plot ${small?'small':''}" role="img" aria-label="${state.view==='brewing'?'Simulated live':'Sample'} extraction: pressure, flow, temperature and weight over time"><svg viewBox="0 0 900 330" preserveAspectRatio="none" aria-hidden="true"><g class="grid">${[40,102.5,165,227.5,290].map((y,i)=>`<path d="M52 ${y}H872"/><text x="34" y="${y+4}" text-anchor="end">${12-i*3}</text>`).join('')}${[0,5,10,15,20,25,30,35].map(t=>`<path d="M${52+t/35*820} 40V290"/><text x="${52+t/35*820}" y="318" text-anchor="middle">${t}s</text>`).join('')}</g>${compare?`<path class="reference" d="${curve('pressure',31.4,true)}"/>`:''}${['temp','weight','flow','pressure'].map(key=>`<path class="line ${key}" data-curve="${key}" d="${curve(key,end)}"/>`).join('')}<path class="cursor" data-cursor d="M${52+end/35*820} 40V290"/></svg></div>`;
}
export function legend(compare=false) {
  return `<div class="legend">${['Pressure','Flow','Temperature','Weight'].map(t=>`<span class="${t.toLowerCase()}"><i></i>${t}</span>`).join('')}${compare?'<span><i class="dashed"></i>Previous shot</span>':''}</div>`;
}
export function phases() {
  const phase=state.elapsed<5?0:state.elapsed<9?1:state.elapsed<26?2:3;
  return `<div class="phases">${['Preinfusion','Pressurize','Extract','Decline'].map((t,i)=>`<span data-phase-index="${i}" class="${state.view==='brewing'&&phase===i?'current':''}"><b>0${i+1}</b> ${t}</span>`).join('')}</div>`;
}
export function miniServices() {
  return `<div class="services">${button(`Steam <span>${state.steam} s</span>`,'service','ghost','data-service="steam"')}${button(`Flush <span>${state.flush} s</span>`,'service','ghost','data-service="flush"')}${button(`Water <span>${state.water} ml</span>`,'service','ghost','data-service="water"')}</div>`;
}
export function historyList(count=4) {
  if(state.scenario==='empty') return `<div class="empty">${label('Shot history')}<h3>Your first shot goes here.</h3><p>Brew a coffee to start comparing your extractions.</p>${button('Use sample shots','samples','secondary')}</div>`;
  return `<div class="shot-list">${Array.from({length:count},(_,i)=>`<button class="shot ${state.selectedShot===i?'selected':''}" data-action="shot" data-shot="${i}" aria-pressed="${state.selectedShot===i}"><span><b>${i===0?'Londinium':i%2?'Adaptive v2':'Blooming espresso'}</b><small>${i===0?'Today, 08:42':i===1?'Today, 08:17':`Yesterday, ${9+i%12}:${String(i*7%60).padStart(2,'0')}`}</small></span><span class="shot-numbers">${(46.2-i%5*.8).toFixed(1)} g<small>${(31.4+i%6*.6).toFixed(1)} s</small></span></button>`).join('')}</div>`;
}
export function review() {
  return `<div class="review-content">${label('Extraction complete')}<h1>Your shot, in review.</h1><p class="muted">${esc(title())} · ${state.dose} g in · 1:${(state.drink/state.dose).toFixed(1)}</p><div class="review-numbers"><div><strong>${state.drink.toFixed(1)}<small>g</small></strong>${label('In the cup')}</div><div><strong>31.4<small>s</small></strong>${label('Shot time')}</div></div><fieldset class="taste"><legend>How did it taste?</legend>${['Sour','Balanced','Bitter'].map(t=>button(t,'taste',state.taste===t?'selected':'',`data-taste="${t}" aria-pressed="${state.taste===t}"`)).join('')}</fieldset><p class="taste-note">${state.taste==='Balanced'?'Keep this recipe for the next cup.':state.taste==='Sour'?'Try a finer grind or a little more yield.':'Try a coarser grind or a little less yield.'}</p>${action()}</div>`;
}
export function footer() { return `<div class="machine-footer"><span>Water 92.0°C</span><span>Steam 145°C</span><span>Tank 1,620 ml</span><span class="footer-end">${state.view==='brewing'?'Simulation in progress':'DE1 · Ready'}</span></div>`; }
export function updateLive(root=document) {
  const r=readings();
  const phase=state.elapsed<5?0:state.elapsed<9?1:state.elapsed<26?2:3;
  root.querySelectorAll('[data-phase-index]').forEach(el=>{el.classList.toggle('current',Number(el.dataset.phaseIndex)===phase);el.classList.toggle('active',Number(el.dataset.phaseIndex)===phase);});
  root.querySelectorAll('[data-live]').forEach(el=>el.textContent=r[el.dataset.live]);
  root.querySelectorAll('[data-curve]').forEach(el=>el.setAttribute('d',curve(el.dataset.curve,state.elapsed)));
  root.querySelectorAll('[data-cursor]').forEach(el=>el.setAttribute('d',`M${52+state.elapsed/35*820} 40V290`));
  root.querySelectorAll('[data-progress]').forEach(el=>el.style.transform=`scaleX(${Math.min(1,Number(r.weight)/state.drink)})`);
  root.querySelectorAll('[data-phase]').forEach(el=>el.textContent=state.elapsed<5?'Preinfusion':state.elapsed<9?'Pressurizing':state.elapsed<26?'Extracting':'Declining');
}

export function fitChartText(root=document) {
  root.querySelectorAll('.plot svg').forEach(svg=>{
    const sx=svg.clientWidth/900, sy=svg.clientHeight/330;
    if(!sx||!sy)return;
    svg.querySelectorAll('text').forEach(el=>{
      const x=Number(el.getAttribute('x')),y=Number(el.getAttribute('y'));
      el.setAttribute('transform',`translate(${x} ${y}) scale(${1/sx} ${1/sy}) translate(${-x} ${-y})`);
    });
  });
}
