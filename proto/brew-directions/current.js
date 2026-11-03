import { state, profiles, title, readings, setView, fit, runClock } from './model.js';
import { chart, updateLive, fitChartText } from './shared.js';
import { installActions, openDialog } from './actions.js';
const get=id=>document.getElementById(id);
const text=(id,value)=>{if(get(id)) get(id).textContent=value;};
function action(id,kind,more={}) {const el=get(id);if(el){el.dataset.action=kind;Object.assign(el.dataset,more);}}
const fields={grind:['grind',.1], 'dose-in':['dose',1],'drink-out':['drink',2],temp:['temp',1],steam:['steam',5],flush:['flush',1],'hot-water-vol':['water',25]};
for(const [id,[field,step]] of Object.entries(fields)) {action(id+'-minus','adjust',{field,delta:String(-step)});action(id+'-plus','adjust',{field,delta:String(step)});}
const actions={'profile-select-btn':'profiles','profile-edit-btn':'profile','ghc-stop-btn':'stop','ghc-water-btn':'service','ghc-steam-btn':'service','ghc-flush-btn':'service','settings-btn':'tools','history-open-btn':'history','sleep-button':'sleep','header-theme-toggle':'theme','fullscreen-toggle-btn':'fullscreen','steam-heater-switch':'heater'};
for(const [id,kind] of Object.entries(actions)) action(id,kind);
for(let i=0;i<5;i++) action('fav-profile-btn-'+i,'choose',{profile:String(i)});
const presets={temp:[75,80,85,92],flush:[5,10,15,20],drink:[36,40,44,46],steam:[15,30,45,60]};
for(const [field,values] of Object.entries(presets)) {
 const ids=field==='temp'?values.map(v=>'temp-preset-'+v):field==='drink'?values.map((v,i)=>'drink-out-preset-'+(i+1)):field==='steam'?values.map((v,i)=>'steam-preset-'+(i+1)):values.map((v,i)=>field+'-preset-'+i);
 ids.forEach((id,i)=>action(id,'preset',{field,value:String(values[i])}));
}
function render(){
 document.documentElement.dataset.theme=state.theme;
 const brewing=state.view!=='home';
 get('main-page').classList.toggle('is-espresso',brewing);
 get('main-page').classList.toggle('is-steam-off',!state.heater);
 get('ghc-controls').style.display='block';
 get('ghc-stop-btn').classList.toggle('opacity-20',state.view!=='brewing');
 text('machine-status',state.scenario==='offline'?'Disconnected':state.view==='brewing'?'Extracting':state.view==='review'?'Shot complete':'Ready');
 text('header-theme-label',state.theme==='dark'?'Dark':'Light');
 text('profile-name',title());get('profile-name').title=title();
 text('yield-line',`Stop at ${state.drink}g`);text('grind-value',state.grind.toFixed(1));text('dose-in-value',state.dose+'g');text('drink-out-value',state.drink+'g');text('drink-ratio-value',`(1:${(state.drink/state.dose).toFixed(1)})`);text('temp-value',state.temp+'°c');
 text('data-mix-temp','92.0°c');text('data-steam-temp','145°c');text('data-tank-vol','1620ml');text('data-clock','08:46');text('steam-duration-value',state.steam+'s');text('steam-flow-value','1.0ml/s');text('flush-value',state.flush+'s');text('hot-water-vol-value',state.water+'ml');text('hot-water-temp-value','85°c');
 for(let i=0;i<5;i++) {const b=get('fav-profile-btn-'+i);b.textContent=state.scenario==='empty'?'':profiles[i];b.title=profiles[i];b.classList.toggle('bg-[var(--mimoja-blue-v2)]',i===state.profile&&state.scenario!=='empty');}
 get('steam-heater-switch').removeAttribute('aria-disabled');get('steam-heater-switch').setAttribute('aria-checked',String(state.heater));
 text('brew-profile-title',title());text('brew-spec',`${state.dose}g → ${state.drink}g · ${state.temp}°c`);
 const r=readings();for(const key of ['pressure','flow','temp','weight','time'])text('brew-readout-'+key,r[key]);
 get('plotly-chart').innerHTML=chart();fitChartText(get('plotly-chart'));
}
installActions(render,(kind,el)=>{
 if(kind==='waterpreset'){text('hot-water-temp-value',el.dataset.value+'°c');return true;}
 if(kind==='flowpreset'){text('steam-flow-value',el.dataset.value+'ml/s');return true;}
 if(kind==='preset'){state[el.dataset.field]=Number(el.dataset.value);render();return true;}
 if(kind==='heater'&&el.id==='steam-heater-switch'){state.heater=!state.heater;render();return true;}
 return false;
});
for(const id of ['steam-mode-toggle','hot-water-mode-toggle','steam-label']) {get(id)?.addEventListener('click',()=>openDialog('tools'));get(id)?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDialog('tools');}});}
for(let i=0;i<4;i++){action('hotwater-temp-preset'+i,'waterpreset',{value:String([75,80,85,92][i])});action('steam-flow-preset-'+(i+1),'flowpreset',{value:String([.5,1,1.5,2][i])});}
get('plotly-chart').addEventListener('click',()=>openDialog('graph'));
document.documentElement.classList.add('skin-theme-changing');
render();fit(get('canvas'));fitChartText(get('canvas'));
requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('skin-theme-changing')));
window.addEventListener('resize',()=>fitChartText(get('canvas')));
runClock(()=>{updateLive();const r=readings();for(const key of ['pressure','flow','temp','weight','time'])text('brew-readout-'+key,r[key]);},render);
