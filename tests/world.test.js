import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,isWalkable,getInteractable} from '../src/world.js';
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function flood(id,spawn){const seen=new Set(),queue=[spawn];for(let i=0;i<queue.length;i++){const {x,y}=queue[i],key=`${x},${y}`;if(seen.has(key)||!isWalkable(id,x,y))continue;seen.add(key);for(const [dx,dy] of Object.values(dirs))queue.push({x:x+dx,y:y+dy});}return seen;}
for(const [id,m] of Object.entries(MAPS)){
 test(`${id}: dimensions and spawn are valid`,()=>{assert.equal(m.terrain.length,m.height);m.terrain.forEach(r=>assert.equal(r.length,m.width));assert.ok(isWalkable(id,m.spawn.x,m.spawn.y));});
 test(`${id}: every interaction and exit is reachable`,()=>{const reachable=flood(id,m.spawn);for(const poi of [...m.npcs,...m.exits,...m.props.filter(p=>p.id)]){
   let reached=false;for(const cell of reachable){const [x,y]=cell.split(',').map(Number);for(const dir of Object.keys(dirs))if(getInteractable(id,x,y,dir)?.id===poi.id)reached=true;}
   assert.ok(reached,`${id}:${poi.id} needs a reachable adjacent interaction tile`);
 }});
 test(`${id}: exits lead to valid walkable positions`,()=>{for(const exit of m.exits){assert.ok(MAPS[exit.target]);assert.ok(isWalkable(exit.target,exit.spawn.x,exit.spawn.y),exit.id);}});
}
test('collision rejects water, cliff, fractional and out-of-map positions',()=>{for(const [x,y] of [[43,10],[1,10],[-1,3],[48,3],[24.5,29],[NaN,1]])assert.equal(isWalkable('village',x,y),false);assert.equal(isWalkable('missing',1,1),false);assert.equal(isWalkable('village',43,16),true);});
test('interaction requires facing the target',()=>{assert.equal(getInteractable('academy',10,6,'up')?.id,'instructor');assert.equal(getInteractable('academy',10,6,'down'),null);});
test('buildings, NPCs and solid props cannot be walked through',()=>{for(const [id,m] of Object.entries(MAPS)){for(const o of [...m.buildings,...m.npcs,...m.props.filter(p=>p.solid)])assert.equal(isWalkable(id,o.x,o.y),false,`${id} ${o.kind||o.id}`);}});
