import { state, profiles, title, esc, setView, adjust } from './model.js';
import { button, metric, historyList, chart, legend, phases, fitChartText } from './shared.js';
let renderPage;
let dialogKind='';
let dialogTrigger;
const dialog=document.getElementById('dialog');
function closeDialog() {
  dialog.close(); dialogKind='';
  if(dialogTrigger?.isConnected) dialogTrigger.focus();
}
export function openDialog(kind) {
  dialogKind=kind; dialogTrigger=document.activeElement;
  fillDialog();
  if(!dialog.open) dialog.showModal();
  fitChartText(dialog);
}
function fillDialog() {
  const heading=({profiles:'Choose a profile',profile:title(),history:'Shot history',tools:'Machine tools',yield:'Drink target',graph:'Extraction graph',sleep:'Machine asleep'})[dialogKind]||'Machine tools';
  let content='';
  if(dialogKind==='profiles') content=`<div class="profile-list">${profiles.map((p,i)=>`<button class="profile-row ${state.profile===i?'selected':''}" data-action="choose" data-profile="${i}"><span>${esc(p)}</span><span>${state.profile===i?'Selected':'↗'}</span></button>`).join('')}</div>`;
  if(dialogKind==='profile') content=`<p class="muted">Pressure profile · ${state.temp}°C · ${state.dose} g → ${state.drink} g</p>${chart()}${legend()}${phases()}${button('Change profile','profiles','secondary')}`;
  if(dialogKind==='graph') content=`${chart()}${legend()}`;
  if(dialogKind==='history') content=historyList(state.scenario==='long'?40:4);
  if(dialogKind==='yield') content=metric('drink','Drink','g',2);
  if(dialogKind==='sleep') content=`<p>Tap Wake to return to your recipe.</p>${button('Wake machine','wake','primary')}`;
  if(dialogKind==='tools') content=`<div class="dialog-fields"><div class="dialog-service"><span>Steam heater</span>${button(state.heater?'On':'Off','heater','secondary',`role="switch" aria-checked="${state.heater}"`)}</div>${metric('steam','Steam','s',5)}${button(state.tool==='steam'?'Stop steam':'Start steam','servicego','secondary',`data-service="steam" ${state.heater?'':'disabled'}`)}${metric('flush','Flush','s',1)}${button(state.tool==='flush'?'Stop flush':'Flush group','servicego','secondary','data-service="flush"')}${metric('water','Hot water','ml',25)}${button(state.tool==='water'?'Stop water':'Dispense water','servicego','secondary','data-service="water"')}</div>${state.notice?`<p class="notice" role="status">${esc(state.notice)}</p>`:''}`;
  dialog.innerHTML=`<div class="section-heading"><h2>${esc(heading)}</h2>${button('Close','close','ghost')}</div>${content}`;
}
export function installActions(render, before) {
  renderPage=render;
  const redraw=()=>{
    const active=document.activeElement;
    const key=active?.getAttribute('data-key')||active?.id;
    renderPage();
    if(key) {
      const replacement=document.getElementById(key)||document.querySelector(`[data-key="${CSS.escape(key)}"]`);
      replacement?.focus({preventScroll:true});
    }
  };
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]'); if(!el||el.disabled) return;
    const action=el.dataset.action;
    if(before?.(action,el)) return;
    if(['profiles','profile','history','tools','yield','graph','sleep'].includes(action)) {openDialog(action);return;}
    if(action==='close') {closeDialog();return;}
    if(action==='choose') {state.profile=Number(el.dataset.profile);if(state.scenario==='long')state.scenario='standard';if(dialog.open)closeDialog();redraw();return;}
    if(action==='adjust') {adjust(el.dataset.field,Number(el.dataset.delta)); if(dialog.open){const field=el.dataset.field,delta=el.dataset.delta;redraw();fillDialog();dialog.querySelector(`[data-field="${field}"][data-delta="${delta}"]`)?.focus();}else redraw();return;}
    if(action==='stop') setView('review');
    if(action==='pause') state.running=!state.running;
    if(action==='next') {setView('home');state.ready=[false,false];}
    if(action==='taste') state.taste=el.dataset.taste;
    if(action==='reconnect') {state.scenario='standard';parent.postMessage({type:'decaid-proto-scenario',scenario:'standard'},location.origin);}
    if(action==='samples') state.scenario='standard';
    if(action==='shot') {state.selectedShot=Number(el.dataset.shot); if(dialog.open){fillDialog();return;}}
    if(action==='service') {state.tool='';openDialog('tools');return;}
    if(action==='heater') {state.heater=!state.heater;fillDialog();dialog.querySelector('[data-action="heater"]')?.focus();return;}
    if(action==='servicego') {state.tool=state.tool===el.dataset.service?'':el.dataset.service;state.notice=state.tool?`${{steam:'Steam',flush:'Flush',water:'Hot water'}[state.tool]} is running in this preview.`:'Cycle stopped.';if(dialog.open){fillDialog();dialog.querySelector(`[data-service="${el.dataset.service}"]`)?.focus();}else redraw();return;}
    if(action==='wake') closeDialog();
    if(action==='theme') {state.theme=state.theme==='light'?'dark':'light';document.documentElement.dataset.theme=state.theme;}
    if(action==='fullscreen') {if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();return;}
    redraw();
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('select[data-profile]')) {state.profile=Number(el.value);if(state.scenario==='long')state.scenario='standard';redraw();}
    if(el.matches('[data-check]')) {state.ready[Number(el.dataset.check)]=el.checked;redraw();document.querySelector(`[data-check="${el.dataset.check}"]`)?.focus();}
    if(el.matches('[data-compare]')) {state.compare=el.checked;redraw();document.querySelector('[data-compare]')?.focus();}
  });
  dialog.addEventListener('close',()=>{dialogKind='';});
}
