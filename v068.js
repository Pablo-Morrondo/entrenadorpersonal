(() => {
'use strict';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev/coach';
const WORKOUTS='entrenador-v05-workouts';
const previousFetch=window.fetch.bind(window);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const ex=(name,sets,reps,rest,load,tech)=>({name,sets,reps,rest_seconds:rest,load_guidance:load,technique:tech});
function recentNames(){return Object.values(read(WORKOUTS,{})).filter(w=>w?.completedAt).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,2).flatMap(w=>(w.exercises||[]).filter(e=>e.done!==false).map(e=>String(e.name||'').toLowerCase()));}
function fallback(body={}){
 const c=body.checkin||{},p=body.profile||{},mins=Math.max(30,Math.min(75,Number(p.available_minutes||40))),place=String(c.place||'Casa'),ach=String(c.achilles||'').toLowerCase(),fatigue=String(c.fatigue||'').toLowerCase(),hist=recentNames();
 const red=/rojo|dolor/.test(ach),yellow=/amarillo|molesta/.test(ach),low=/alta/.test(fatigue);
 if(red){return {status:'ok',message:'El entrenador online no respondió. He preparado una sesión local conservadora por el estado del Aquiles.',session:{title:`${place} — recuperación y tren superior suave`,duration_minutes:Math.min(mins,35),load:'baja',objective:'Mantener actividad sin aumentar carga sobre el Aquiles.',reason:'Modo local de respaldo. Con Aquiles en rojo no se añaden impactos ni progresiones.',exercises:[ex('Respiración y movilidad torácica',2,'8–10','30','Suave','Sentado o tumbado, sin tensión en el tobillo.'),ex('Press de pecho sentado o en suelo',3,'10–12','60','RPE 5–6/10','Apoyo estable y sin empujar con el pie lesionado.'),ex('Remo sentado con banda',3,'10–12','60','RPE 5–6/10','Tirar con codos, tronco estable.'),ex('Dead bug',3,'10–12 por lado','30','Controlado','Mantener zona lumbar estable y tobillo relajado.'),ex('Movilidad de tobillo ya autorizada',3,'15','30','Sin dolor','Solo ejercicios de rehabilitación que ya estén pautados.')]}}}
 let exercises=[];
 const atHome=/casa/i.test(place);
 const didPush=hist.some(n=>/press.*pecho|flexion|flexión/.test(n)),didRow=hist.some(n=>/remo/.test(n)),didShoulder=hist.some(n=>/hombro/.test(n));
 if(atHome){
   if(!didPush)exercises.push(ex('Flexiones inclinadas en mesa o pared',3,'8–12','60','RPE 6/10','Cuerpo alineado; apoyo estable; sin tensión en el tobillo.'));
   else exercises.push(ex('Press de pecho en suelo con mancuernas o botellas',3,'10–12','60','RPE 6/10','Tumbado; descenso controlado; pies relajados.'));
   if(!didRow)exercises.push(ex('Remo sentado con banda',3,'10–12','60','RPE 6/10','Codos cerca del cuerpo; retracción escapular.'));
   else exercises.push(ex('Pull-apart con banda sentado',3,'12–15','45','Ligero-moderado','Separar la banda a la altura del pecho sin encoger hombros.'));
   if(!didShoulder)exercises.push(ex('Press de hombro sentado',3,'8–12','60','RPE 6/10','Sentado y estable; sin impulso de piernas.'));
   else exercises.push(ex('Elevaciones laterales sentado',3,'12–15','45','Ligero','Subir hasta línea de hombros sin balanceo.'));
   exercises.push(ex('Curl de bíceps sentado',3,'10–12','45','RPE 6/10','Codos quietos y movimiento controlado.'));
   exercises.push(ex('Extensión de tríceps sentado con banda o mancuerna',3,'10–12','45','RPE 6/10','Sin arquear la espalda.'));
 }else{
   exercises=[ex('Jalón al pecho',3,'10–12','60','RIR 3','Pecho alto, tirar con codos.'),ex('Press de pecho en máquina',3,'10–12','60','RIR 3','Sin despegar espalda del apoyo.'),ex('Curl femoral sentado',3,'10–12','60','Ligero-moderado','Tobillo relajado; detener si molesta el Aquiles.'),ex('Extensión de cuádriceps',3,'10–12','60','Ligero-moderado','Movimiento controlado, sin impulso.')];
 }
 exercises.push(ex('Dead bug',3,'12 por lado','30','Controlado','Zona lumbar estable; no forzar extensión del tobillo.'));
 exercises.push(ex('Rehabilitación de tobillo ya pautada',3,'Según pauta','30','Sin progresar hoy','Realiza únicamente los ejercicios que ya vienes haciendo y tolerando.'));
 return {status:'ok',message:'El entrenador online no respondió a tiempo. He generado esta sesión en modo local para que no te quedes bloqueado.',session:{title:`${place} — fuerza variada, core y rehabilitación`,duration_minutes:mins,load:yellow||low?'baja':'moderada',objective:'Mantener progresión general sin repetir por inercia y respetando la tolerancia actual del Aquiles.',reason:'Sesión de respaldo generada con tu check-in e historial reciente. No sustituye restricciones explícitas del fisio/trauma.',exercises}};
}
window.fetch=async(input,init={})=>{
 const url=typeof input==='string'?input:(input?.url||''),method=(init?.method||'GET').toUpperCase();
 if(method==='POST'&&url===COACH){
   let body={};try{body=JSON.parse(init.body||'{}')}catch{}
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),22000);
   try{
     const r=await previousFetch(input,{...init,signal:controller.signal});
     if(r.ok)return r;
     if(r.status<500&&r.status!==429)return r;
     return new Response(JSON.stringify(fallback(body)),{status:200,headers:{'Content-Type':'application/json','X-Trainer-Fallback':'local'}});
   }catch(e){
     return new Response(JSON.stringify(fallback(body)),{status:200,headers:{'Content-Type':'application/json','X-Trainer-Fallback':'local'}});
   }finally{clearTimeout(timer)}
 }
 return previousFetch(input,init);
};
const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.8';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.6.8'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=068').then(r=>r.update()).catch(()=>{}));
})();
