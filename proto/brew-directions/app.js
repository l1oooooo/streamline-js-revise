import { state, fit, runClock } from './model.js';
import { updateLive, fitChartText } from './shared.js';
import { installActions } from './actions.js';
import { render as studio } from './studio.js';
import { render as panorama } from './panorama.js';
import { render as sequence } from './sequence.js';
const directions={studio,sequence,panorama};
const direction=new URLSearchParams(location.search).get('direction');
const renderer=directions[direction]||studio;
const canvas=document.getElementById('canvas');
document.documentElement.dataset.theme=state.theme;
function render() {
  canvas.innerHTML=renderer();
  canvas.querySelectorAll('[data-action]').forEach((el,i)=>el.dataset.key=`${el.dataset.action}-${el.dataset.field||el.dataset.profile||el.dataset.taste||i}-${el.dataset.delta||''}`);
}
render();fit(canvas);fitChartText(canvas);installActions(()=>{render();fitChartText(canvas);});
window.addEventListener('resize',()=>fitChartText(canvas));
runClock(()=>updateLive(),()=>{render();fitChartText(canvas);});
