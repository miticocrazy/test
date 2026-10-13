// Se conserva la aventura antigua y se importa una sola vez, sin enviar datos a ningún servidor.
const E=window.ENG;
for(const preview of [false,true]){
 E.S.preview=preview;
 const target=E.S.key();
 if(E.Store.get(target))continue;
 try{
  const old=JSON.parse(E.Store.get(preview?'aventura-preview-v1':'aventura-naroa-v1'));
  if(old?.version!==1)continue;
  const state=E.S.load();
  const ids={'forest:find':'c1a','forest:memory':'c1b','lighthouse:tiles':'c2a','lighthouse:sequence':'c2b','garden:puzzle':'c3a','garden:path':'c3b'};
  for(const id of old.done||[]){const skipped=id.endsWith(':skip'),key=ids[id.replace(/:skip$/,'')];if(!key)continue;state.games[key]={done:true,skipped,awarded:!skipped,plays:1};}
  state.xp=Object.values(state.games).filter(g=>g.awarded).length*25;
  for(const id of old.rewards||[]){const i=['forest','lighthouse','garden','door'].indexOf(id);if(i>=0)state.rewards['s'+(i+1)]=true;}
  for(const [id,response] of Object.entries(old.responses||{})){const i=['forest','lighthouse','garden'].indexOf(id);if(i>=0)state.answers['c'+(i+1)]={opts:response.choices||[],text:response.text||''};}
  state.introDone=!!old.entered;state.settings={sfx:!!old.prefs?.sound,music:false,motion:old.prefs?.motion?true:null};
  if(old.notebook)state.cuaderno.push({t:old.notebook,at:Date.now()});
  if((old.rewards||[]).includes('door'))state.finale.opened=true;
  E.S.save();
 }catch{}
}
E.S.preview=false;
