// Intercambio explícito de turnos: sin servidor, sin sincronización silenciosa.
// El paquete incluye SOLO misiones propuestas y avances confirmados de esta dinámica.
import {createService} from './service.js';
const prefix='aventura-duo-room-v1:';
const memory=new Map();
function load(room){if(memory.has(room))return memory.get(room);let data={};try{data=JSON.parse(localStorage.getItem(prefix+room))||{}}catch{}memory.set(room,data);return data;}
function save(room){try{localStorage.setItem(prefix+room,JSON.stringify(load(room)))}catch{}}
export const store={
 async get(key){const room=key.split('/')[0];return load(room)[key]||null;},
 async setJSON(key,value,options){const room=key.split('/')[0],data=load(room);if(options?.onlyIfNew&&data[key])return{modified:false};data[key]=structuredClone(value);save(room);return{modified:true};},
 async list({prefix:key}){return{blobs:Object.keys(load(key.split('/')[0])).filter(k=>k.startsWith(key)).map(key=>({key}))};}
};
export const localService=createService(store);
function bytes64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function from64(value){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export async function invitationURL(room,invite,origin){const entries=Object.entries(load(room)).map(([key,value])=>[key.slice(room.length+1),value]);const raw=new TextEncoder().encode(JSON.stringify({v:1,room,invite,entries}));let mode='j',bytes=raw;
 if(typeof CompressionStream!=='undefined'){try{bytes=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());mode='z';}catch{}}
 return new URL('/#duo=1.'+mode+'.'+bytes64(bytes),origin).href;
}
export async function parseInvitation(value,origin){try{const raw=new URLSearchParams(new URL(value,origin).hash.slice(1)).get('duo');const [version,mode,data]=raw.split('.');if(version!=='1'||data.length>100000)throw Error();let bytes=from64(data);if(mode==='z'){const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));const reader=stream.getReader(),chunks=[];let length=0;while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>120000){await reader.cancel();throw Error();}chunks.push(part.value);}bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}}else if(mode!=='j')throw Error();if(bytes.length>120000)throw Error();const p=JSON.parse(new TextDecoder().decode(bytes));if(p.v!==1||!/^[0-9a-f-]{36}$/.test(p.room)||!/^[\w-]{32}$/.test(p.invite)||!Array.isArray(p.entries)||p.entries.length>160)throw Error();return p;}catch{throw Error('No se puede leer esta invitación. Pega el enlace completo que te ha enviado la otra persona.');}}
export async function importInvitation(p){const current=load(p.room);const imported={};
 for(const [key,value] of p.entries){
  if(key==='meta'){if(value?.version!==1||value.profiles?.length!==2||new Set(value.profiles).size!==2||value.profiles.some(n=>!['paulo','naroa'].includes(n))||value.keys?.length!==2||value.keys.some(k=>!/^[a-f0-9]{64}$/.test(k)))throw Error('La invitación no es válida.');imported[`${p.room}/meta`]={version:1,profiles:value.profiles,keys:value.keys};}
  else if(/^progress\/[\w-]{1,60}\/[01]$/.test(key)&&value?.done===true){const clean={done:true};if(value.sequence){if(!Array.isArray(value.sequence)||value.sequence.length!==3||value.sequence.some(v=>!Number.isInteger(v)||v<0||v>3))throw Error('El avance no es válido.');clean.sequence=value.sequence;}if(value.choices){if(!Array.isArray(value.choices)||value.choices.length!==2||value.choices.some(v=>!Number.isInteger(v)||v<0||v>5))throw Error('El rincón no es válido.');clean.choices=value.choices;}imported[`${p.room}/${key}`]=clean;}
  else if(/^missions\/[\w-]{1,60}$/.test(key)){if(typeof value.title!=='string'||value.title.length>80||typeof value.description!=='string'||value.description.length>500||!['basket','lights','words','room','activity'].includes(value.type)||typeof value.message!=='string'||value.message.length>700)throw Error('La misión no es válida.');imported[`${p.room}/${key}`]={id:key.slice(9),title:value.title,description:value.description,message:value.message,type:value.type,author:['Paulo','Naroa'].includes(value.author)?value.author:'Una propuesta compartida',audio:typeof value.audio==='string'&&/^\/?media\/[a-zA-Z0-9_-]+\.(m4a|mp3|ogg|wav|webm)$/.test(value.audio)?value.audio:null};}
 }
 const meta=imported[`${p.room}/meta`];if(!meta)throw Error('Falta la dinámica en este enlace.');const previous=current[`${p.room}/meta`];if(previous&&JSON.stringify(previous)!==JSON.stringify(meta))throw Error('La invitación no coincide con la dinámica de este móvil.');
 for(const [key,value] of Object.entries(imported))if(!current[key])current[key]=value;
 save(p.room);
}
