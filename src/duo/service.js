import {missions,names,words} from './content.js';
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const generateToken=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const randomUUID=()=>crypto.randomUUID();
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const idOK=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,60}$/.test(id);
const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;
function same(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
export function createService(store){return async request=>{
 try{
  const url=new URL(request.url),action=url.pathname.split('/').filter(Boolean).at(-1);
  let body={};
  if(request.method==='POST'){const raw=await request.text();if(raw.length>5000)fail('El mensaje es demasiado largo.');try{body=JSON.parse(raw)}catch{fail('No se ha podido leer la petición.')}}
  else if(request.method!=='GET')return response({error:'Esta acción no está disponible.'},405);
  if(action==='create'&&request.method==='POST'){
   const profile=body.profile;if(!['paulo','naroa'].includes(profile))fail('Elige quién eres.');
   const room=randomUUID(),ownerToken=generateToken(),invite=generateToken();
   await store.setJSON(`${room}/meta`,{version:1,profiles:[profile,profile==='paulo'?'naroa':'paulo'],keys:[await hash(ownerToken),await hash(invite)]},{onlyIfNew:true});
   return response({room,token:ownerToken,invite,role:0,profile},201);
  }
  const room=body.room||url.searchParams.get('room');if(typeof room!=='string'||!/^[0-9a-f-]{36}$/.test(room))fail('La invitación no es válida.');
  const meta=await store.get(`${room}/meta`,{type:'json'});if(!meta)fail('No encontramos esta dinámica. Comprueba la invitación.',404);
  let token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
  if(action==='join')token=body.invite||'';
  if(typeof token!=='string'||token.length>200)fail('La invitación no es válida.',403);
  const digest=await hash(token);const role=meta.keys.findIndex(k=>same(k,digest));if(role<0)fail('No tienes acceso a esta dinámica. Comprueba tu invitación.',403);
  if(action==='join'){if(role!==1)fail('Usa la invitación de la otra persona.');return response({room,token,role,profile:meta.profiles[role]});}
  const custom=await store.list({prefix:`${room}/missions/`});
  const extra=await Promise.all(custom.blobs.map(b=>store.get(b.key,{type:'json'})));
  const all=[...missions,...extra.filter(Boolean)];
  if(action==='state'){
   const list=await Promise.all(all.map(async m=>{const progress=await Promise.all([0,1].map(r=>store.get(`${room}/progress/${m.id}/${r}`,{type:'json'})));return {...m,progress};}));
   return response({room,role,people:meta.profiles.map(p=>names[p]),missions:list,lights:list.filter(m=>m.progress.every(p=>p?.done)).length});
  }
  if(action==='add'&&request.method==='POST'){
   if(extra.length>=40)fail('Ya hay muchas misiones guardadas. Podemos disfrutar de las que tenéis.');
   const m=body.mission;if(!m||!text(m.title,80)||!text(m.description,500)||!['basket','lights','words','room','activity'].includes(m.type))fail('Añade un título, una propuesta breve y un tipo de juego.');
   if(m.message&&!text(m.message,700))fail('El mensaje debe ser breve.');
   if(m.audio&&!/^\/?media\/[a-zA-Z0-9_-]+\.(m4a|mp3|ogg|wav|webm)$/.test(m.audio))fail('Usa la ruta de una grabación publicada en media, o deja el campo vacío.');
   const item={id:randomUUID(),title:m.title.trim(),description:m.description.trim(),type:m.type,message:(m.message||'').trim(),author:names[meta.profiles[role]],audio:m.audio||null};
   await store.setJSON(`${room}/missions/${item.id}`,item,{onlyIfNew:true});return response({mission:item},201);
  }
  if(action==='complete'&&request.method==='POST'){
   if(!idOK(body.missionId))fail('La misión no es válida.');const m=all.find(m=>m.id===body.missionId);if(!m)fail('No encontramos esa misión.',404);
   if(body.skipped){return response({saved:false});} // Pasar nunca se comunica a la otra persona.
   let contribution={done:true};const p=body.play;
   if(m.type==='basket'||m.type==='words'){const target=m.type==='basket'?[0,1,2,3]:words.map((_,i)=>i);if(!Array.isArray(p)||p.length!==target.length||p.some((v,i)=>v!==target[i]))fail('Todavía queda una parte del juego. Puedes usar las pistas.');}
   if(m.type==='lights'){
    if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isInteger(n)||n<0||n>3))fail('Elige tres luces.');
    if(role===1){const first=await store.get(`${room}/progress/${m.id}/0`,{type:'json'});if(!first)fail('La otra persona todavía no ha dejado sus luces.',409);if(p.some((n,i)=>n!==first.sequence[i]))fail('No es esa secuencia. Puedes mirar la pista y repetir.');}
    contribution.sequence=p;
   }
   if(m.type==='room'){if(!Array.isArray(p)||p.length!==2||new Set(p).size!==2||p.some(n=>!Number.isInteger(n)||n<0||n>5))fail('Elige dos cosas para vuestro rincón.');contribution.choices=p;}
   const write=await store.setJSON(`${room}/progress/${m.id}/${role}`,contribution,{onlyIfNew:true});return response({saved:write.modified});
  }
  return response({error:'Esta acción no está disponible.'},404);
 }catch(error){return response({error:error.status?error.message:'Ahora no se ha podido guardar. Tu partida sigue en este móvil; prueba de nuevo cuando tengas conexión.'},error.status||503);}
};}
