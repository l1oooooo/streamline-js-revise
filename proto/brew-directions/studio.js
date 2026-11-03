import { state, title, esc } from './model.js';
import { header, label, profileSelect, metric, action, miniServices, button } from './shared.js';
import { render as instrument } from './instrument.js';
export function render() {
 if(state.view!=='home') return instrument().replace('app instrument','app instrument studio');
 return `<div class="app focus studio">${header()}<main class="focus-main"><div class="focus-home"><section class="focus-recipe ${title().length>28?'long-title':''}">${label('Your next coffee')}<h1>${esc(title())}</h1><div class="focus-ratio">${state.dose}<span>→</span>${state.drink}<small>g</small></div><p class="focus-description">1:${(state.drink/state.dose).toFixed(1)} · Stop at weight</p><div class="studio-profile-row">${profileSelect()}${button('View profile','profile','text-btn')}</div>${state.scenario==='offline'?action():''}<div class="focus-fields">${metric('grind','Grind','',.1)}${metric('dose','Dose','g',1)}${metric('drink','Drink','g',2)}${metric('temp','Brew','°C',1)}</div></section><aside class="focus-photo"><img src="/src/ui/skin/profile/preview-${state.profile+1}.webp" width="600" height="640" alt="Selected abstract profile artwork"><div class="photo-caption"><span>THE DAILY RITUAL</span><span>1:${(state.drink/state.dose).toFixed(1)} · ${state.temp}°C</span></div></aside></div></main>${miniServices()}</div>`;
}
