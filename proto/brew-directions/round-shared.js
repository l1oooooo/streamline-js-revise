import { state, profiles, title, readings, esc } from './model.js';
import { label, button } from './shared.js';
export function favourites(shelf=false) {
  if(state.scenario==='empty') return `<nav class="${shelf?'profile-shelf':'favourite-rail'} empty-favourites" aria-label="Favorite profiles"><h3>Your daily recipes, here.</h3><p class="muted">Choose a profile to start your next coffee.</p>${button('Browse profiles','profiles','secondary')}</nav>`;
  return `<nav class="${shelf?'profile-shelf':'favourite-rail'}" aria-label="Favorite profiles">${profiles.map((name,i)=>`<button class="favourite-card ${state.profile===i?'selected':''}" data-action="choose" data-profile="${i}" aria-pressed="${state.profile===i}" title="${esc(name)}"><span class="favourite-index">0${i+1}</span><span class="favourite-name">${esc(name)}</span><span class="favourite-art" style="background-image:url('/src/ui/skin/profile/preview-${i+1}.webp')" aria-hidden="true"></span></button>`).join('')}</nav>`;
}
export function liveNumber(key,name,unit,large=false) {
  const r=readings();
  return `<div class="live-number ${large?'major':''}">${label(name)}<div><span data-live="${key}">${r[key]}</span><small>${unit}</small></div></div>`;
}
export function recipeSummary() {
  return `<p class="recipe-summary">${state.dose} g → ${state.drink} g <span>·</span> 1:${(state.drink/state.dose).toFixed(1)} <span>·</span> ${state.temp}°C</p>`;
}
