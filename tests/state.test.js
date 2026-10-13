import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const window={};runInNewContext(readFileSync(new URL('../src/legacy/config.js',import.meta.url),'utf8'),{window});
test('La base nueva conserva los cuatro instantes exactos de Madrid',()=>{assert.deepEqual(Array.from(Object.values(window.AVENTURA.fechas)),['2026-10-13T07:00:00+02:00','2026-10-14T09:00:00+02:00','2026-10-15T09:00:00+02:00','2026-10-16T10:00:00+02:00']);});
test('La migración preserva XP, premios y notas sin duplicar al volver a ejecutarla',()=>{const map=new Map();map.set('aventura-naroa-v1',JSON.stringify({version:1,entered:true,done:['forest:find','lighthouse:sequence','garden:path:skip'],rewards:['forest'],responses:{forest:{choices:['Un abrazo'],text:'Solo para mí'}},notebook:'Una nota',prefs:{sound:false,motion:true}}));let preview=false,current;
const E={Store:{get:k=>map.get(k)||null},S:{get preview(){return preview},set preview(v){preview=v},key(){return preview?'new-preview':'new-real'},load(){return current={games:{},rewards:{},answers:{},cuaderno:[],finale:{}}},save(){map.set(this.key(),JSON.stringify(current))}}};
const source=readFileSync(new URL('../src/migrate.js',import.meta.url),'utf8');runInNewContext(source,{window:{ENG:E}});const state=JSON.parse(map.get('new-real'));assert.equal(state.xp,50);assert.equal(state.rewards.s1,true);assert.equal(state.answers.c1.text,'Solo para mí');assert.equal(state.answers.c1.opts[0],'Un abrazo');assert.equal(state.cuaderno[0].t,'Una nota');assert.equal(state.games.c3b.awarded,false);runInNewContext(source,{window:{ENG:E}});assert.deepEqual(JSON.parse(map.get('new-real')),state);});
