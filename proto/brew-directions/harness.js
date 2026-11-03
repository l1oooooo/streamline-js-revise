const names=['Current','Studio','Sequence','Panorama'];
const slugs=['current','studio','sequence','panorama'];
const axes=['Current layout. Start from the group head.','Large cover. Profile selection stays on the left.','Guided preparation, without the top progress bar.','A horizontal recipe shelf. An uninterrupted chart.'];
const params=new URLSearchParams(location.search);
const config={view:['home','brewing','review'].includes(params.get('view'))?params.get('view'):'home',scenario:['standard','long','empty','offline'].includes(params.get('scenario'))?params.get('scenario'):'standard',theme:params.get('theme')==='dark'?'dark':'light'};
const requested=(parseInt(params.get('v'),10)||1)-1;
const migrated=params.get('round')==='3'?requested:([0,1,1,2,3][requested]??0);
let selected=Math.max(0,Math.min(names.length-1,migrated));
export const variants=slugs.map((slug,i)=>()=>{
 selected=i;
 document.getElementById('direction-number').textContent=`0${i+1} / 04`;
 document.getElementById('direction-name').textContent=names[i];
 document.getElementById('direction-axis').textContent=axes[i];
 const query=new URLSearchParams({...config,direction:slug});
 return `<iframe title="${names[i]} design preview" src="${slug==='current'?'current.html':'screen.html'}?${query}" allow="fullscreen"></iframe>`;
});
function controls(){
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(config.view===b.dataset.view)));
 document.getElementById('scenario').value=config.scenario;
 const theme=document.getElementById('theme');theme.textContent=config.theme==='dark'?'Light preview':'Dark preview';theme.setAttribute('aria-pressed',String(config.theme==='dark'));
 const url=new URL(location);url.searchParams.set('v',selected+1);url.searchParams.set('round','3');for(const [key,value] of Object.entries(config))url.searchParams.set(key,value);history.replaceState(null,'',url);
}
function remount(){controls();document.getElementById('stage').innerHTML=variants[selected]();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{config.view=b.dataset.view;remount();}));
document.getElementById('scenario').addEventListener('change',e=>{config.scenario=e.target.value;remount();});
document.getElementById('theme').addEventListener('click',()=>{config.theme=config.theme==='light'?'dark':'light';remount();});
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==document.querySelector('#stage iframe')?.contentWindow)return;
 if(e.data?.type==='decaid-proto-key'){
   const key=e.data.key;
   let next=selected;
   if(['1','2','3','4'].includes(key))next=Number(key)-1;
   else if(key==='ArrowRight')next=(selected+1)%names.length;
   else if(key==='ArrowLeft')next=(selected-1+names.length)%names.length;
   else if(key==='r'||key==='R'){remount();return;}
   else return;
   document.querySelectorAll('.proto-picker-item')[next]?.click();return;
 }
 if(e.data?.type==='decaid-proto-view'&&['home','brewing','review'].includes(e.data.view)){config.view=e.data.view;controls();}
 if(e.data?.type==='decaid-proto-scenario'&&e.data.scenario==='standard'){config.scenario='standard';controls();}
});
controls();
