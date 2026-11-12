import {createGame, move, interact, advanceDialogue, battleAction, useItem, serialize, restore, ITEMS, ACTIONS} from './engine.js';
import {MAPS, getInteractable} from './world.js';
import {render} from './render.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#game'), ctx = canvas.getContext('2d');
const SAVE_KEY = 'ninja-tales-save-v1';
const QUESTS = [
 ['First steps', 'Meet Instructor Sora inside Windward Academy. Follow Lantern Walk north.'],
 ['Pack for the journey', 'Collect training supplies from Merchant Ivo in the southeast shop.'],
 ['Better together', 'Return to Instructor Sora at the academy. Your partner is waiting.'],
 ['Read the moment', 'Speak to Scout Toma in the eastern training yard. Win the team exercise.'],
 ['A promise kept', 'Report your victory to Instructor Sora at the academy.'],
 ['A new beginning', 'Your first lesson is complete. Explore, rest, or practice your techniques.'],
];
let state = createGame(), selectedTarget = 0, modal = null, returnFocus = null;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let partySignature = '', bagSignature = '', lastMode = '', lastQuest = -1;
let lastPaint = 0;
const held = new Map();
let initialMessage;
try {
 const saved = localStorage.getItem(SAVE_KEY);
 if (saved) { state = restore(saved); initialMessage = state.message; $('#save-status').textContent = 'Device save loaded'; }
 else $('#save-status').textContent = 'No device save yet';
} catch { initialMessage = 'Your saved progress could not be loaded. It has been kept; you can import a backup from the menu.'; $('#save-status').textContent = 'Save unavailable'; }

function el(tag, className, text) {
 const node = document.createElement(tag);
 if(className) node.className = className;
 if(text !== undefined) node.textContent = text;
 return node;
}
function announce(text) { $('#status').textContent = text; if(modal === 'menu') $('#menu-status').textContent = text; }
function meter(label, value, maximum, kind='') {
 const row = el('div','stat-row'); row.append(el('span','',label));
 const bar = el('div',`meter ${kind}`), fill = el('span'); fill.style.width = `${Math.max(0,Math.min(100,value/maximum*100))}%`;
 bar.append(fill); row.append(bar,el('span','stat-value',`${value}/${maximum}`));
 row.setAttribute('aria-label',`${label}: ${value} of ${maximum}`); return row;
}
// Original pixel portraits use the same limited forest/linen palette as the village.
function portrait(canvas, id, large=false) {
 const c=canvas.getContext('2d'); c.clearRect(0,0,canvas.width,canvas.height); c.imageSmoothingEnabled=false;
 const scale=large?3:2, ox=Math.floor((canvas.width-12*scale)/2), oy=large?8:6;
 c.save();c.translate(ox,oy);c.scale(scale,scale);
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 const aya=id==='aya', enemy=id==='enemy', coat=aya?'#8e5e78':enemy?'#ac7541':'#4f8b81';
 r(2,17,9,2,'#1d382f');r(3,13,3,5,'#2a3f3c');r(7,13,3,5,'#253b39');
 r(2,8,9,7,'#233c38');r(3,8,7,6,coat);r(4,8,5,1,'#d7c493');
 r(1,9,2,5,coat);r(10,9,2,5,coat);r(1,13,2,2,'#d8a577');r(10,13,2,2,'#d8a577');
 r(3,1,7,7,'#322f2b');r(2,2,9,4,'#302d2c');r(3,4,7,4,'#dca97b');r(4,4,5,3,'#edc092');
 r(3,1,7,2,aya?'#47313d':'#34362f');r(2,2,3,3,aya?'#47313d':'#34362f');r(9,2,2,3,'#34362f');
 r(4,5,1,1,'#293b33');r(8,5,1,1,'#293b33');r(6,7,2,1,'#ad7755');
 r(3,12,7,1,'#d5b575');r(8,12,1,2,'#f1d8a2');if(aya)r(10,4,2,5,'#47313d');
 c.restore();
}
function renderParty() {
 const signature=JSON.stringify(state.party);
 if(signature===partySignature) return;
 partySignature=signature; const list=$('#party-list'); list.replaceChildren();
 for(const member of state.party) {
  const card=el('div','party-member'), picture=el('canvas','portrait');picture.width=44;picture.height=48;picture.setAttribute('aria-hidden','true');
  const details=el('div'), heading=el('div','member-heading',member.name);heading.append(el('small','',`Lv.${member.level}`));
  details.append(heading,el('div','member-role',member.id==='ren'?'THE PATHFINDER':'STORY COMPANION'),meter('HP',member.hp,member.maxHp),meter('CH',member.chakra,member.maxChakra,'chakra'));
  card.append(picture,details);list.append(card);portrait(picture,member.id);
 }
 if(state.party.length<4) { const empty=el('div','empty-party');empty.append(el('span','','+'),el('div','',`${4-state.party.length} story companion slots`));list.append(empty); }
 $('#party-count').textContent=`${state.party.length} / 4`;
}
function renderBag() {
 const signature=JSON.stringify([state.inventory,state.gold,state.mode]);
 if(signature===bagSignature)return;bagSignature=signature;
 $('#inventory-list').replaceChildren();
 for(const [id,item] of Object.entries(ITEMS)) {
  const row=el('div','bag-item'), detail=el('div'), name=el('div','item-name',item.name);
  name.append(el('small','',item.description));detail.append(el('span','item-icon',id==='salve'?'✚':'♧'),name);
  const button=el('button','',`×${state.inventory[id]} · Use`);button.dataset.item=id;button.setAttribute('aria-label',`Use ${item.name}, ${state.inventory[id]} remaining`);button.disabled=state.mode!=='explore'||state.inventory[id]===0;
  button.addEventListener('click',()=>act(()=>useItem(state,id)));row.append(detail,button);$('#inventory-list').append(row);
 }
 $('#gold').textContent=`${state.gold} coins`;
}
function renderQuest() {
 const stage=state.quest.stage; if(stage===lastQuest)return;lastQuest=stage;
 $('#quest-title').textContent=QUESTS[stage][0];$('#quest-text').textContent=QUESTS[stage][1];$('#quest-text').dataset.stage=stage;
 $('#quest-progress').replaceChildren(); for(let i=0;i<5;i++)$('#quest-progress').append(el('span',i<stage?'done':''));
 $('#quest-progress').setAttribute('aria-label',`${stage} of 5 objectives completed`);
 $('#journal-steps').replaceChildren();for(let i=0;i<5;i++)$('#journal-steps').append(el('li',i<stage?'complete':i===stage?'current':'',QUESTS[i][1]));
 $('#progress-label').textContent=stage===5?'PROLOGUE · LESSON COMPLETE':'PROLOGUE · A NEW BEGINNING';
}
function renderBattle() {
 const battle=state.battle;if(!battle)return;
 if(!battle.enemies[selectedTarget]||battle.enemies[selectedTarget].hp<=0)selectedTarget=battle.enemies.findIndex(e=>e.hp>0);
 const actor=state.party[battle.actorIndex];
 $('#battle-round').textContent=`ROUND ${battle.turn}`;
 const cards=$('#enemy-cards');cards.replaceChildren();
 battle.enemies.forEach((enemy,index)=>{
  const card=el('button','combat-card enemy-card'); card.dataset.target=index;card.disabled=enemy.hp<=0;
  card.setAttribute('aria-pressed',String(index===selectedTarget));card.setAttribute('aria-label',`Target ${enemy.name}, ${enemy.hp} HP, ${enemy.intent}`);
  card.append(el('strong','',enemy.name),meter('HP',enemy.hp,enemy.maxHp),el('small','',enemy.hp<=0?'DEFEATED':`${index===selectedTarget?'▸ ':''}${enemy.intent.toUpperCase()}`));
  card.addEventListener('click',()=>{selectedTarget=index;renderBattle()});cards.append(card);
 });
 const actorCard=el('div','combat-card');actorCard.append(el('strong','',`${actor.name} · Lv.${actor.level}`),meter('HP',actor.hp,actor.maxHp),meter('CH',actor.chakra,actor.maxChakra,'chakra'));
 $('#battle-actor').replaceChildren(actorCard);
 $('#battle-intent').textContent=`${actor.name}'s turn. ${battle.enemies.filter(e=>e.hp>0).map(e=>`${e.name}: ${e.intent}`).join(' · ')}.`;
 $('#battle-log').textContent=battle.log.slice(-2).join(' ');
 $('#battle-actions [data-action=jutsu] b').textContent=actor.jutsu[0];
 $('#battle-actions [data-action=jutsu] small').textContent=`${ACTIONS.jutsu.cost} chakra · Piercing hit`;
 $('#battle-actions [data-action=jutsu]').disabled=actor.chakra<ACTIONS.jutsu.cost;
 $('#battle-actions [data-action=item]').disabled=state.inventory.salve<=0||actor.hp===actor.maxHp;
 $('#battle-actions [data-action=item] small').textContent=`${state.inventory.salve} left · Restore 28 HP`;
 portrait($('#enemy-sprite'),'enemy',true);portrait($('#ally-sprite'),actor.id,true);
}
function sync() {
 const map=MAPS[state.mapId];$('#location').textContent=map.name;
 $('#position-label').textContent=state.mapId==='village'?'Lantern Walk · Leafwood':'INDOORS · '+map.name;
 Object.assign(canvas.dataset,{map:state.mapId,x:state.player.x,y:state.player.y,mode:state.mode,stage:state.quest.stage});
 const poi=getInteractable(state.mapId,state.player.x,state.player.y,state.player.facing);
 $('#interact-hint').textContent=poi?`${poi.target?'Enter':poi.id==='bed'?'Use':'Speak to'} ${poi.name}`:'Face a person, sign, or doorway';
 $('#world-tip').hidden=state.mode!=='explore';$('#dialogue-panel').hidden=state.mode!=='dialogue';$('#battle-panel').hidden=state.mode!=='battle';
 if(state.dialogue){$('#dialogue-speaker').textContent=state.dialogue.speaker;$('#dialogue-text').textContent=state.dialogue.lines[state.dialogue.index];$('#dialogue-count').textContent=`${state.dialogue.index+1} / ${state.dialogue.lines.length}`;}
 $('#interact').disabled=state.mode==='battle';$('#save-game').disabled=state.mode!=='explore';
 $('#export-save').disabled=state.mode!=='explore';
 renderParty();renderBag();renderQuest();renderBattle();
 if(state.mode!==lastMode){clearHeld();if(state.mode==='dialogue')$('#dialogue-next').focus({preventScroll:true});else if(state.mode==='battle')$('#battle-actions [data-action=strike]').focus({preventScroll:true});else if(lastMode)canvas.focus({preventScroll:true});lastMode=state.mode;}
 ctx.imageSmoothingEnabled=false;render(ctx,state,reducedMotion?0:performance.now());
}
function act(action) {
 if(modal)return;
 const stage=state.quest.stage, mode=state.mode;
 const result=action();sync();
 if(result?.message)announce(result.message);
 if(state.mode==='explore'&&(state.quest.stage!==stage||mode==='battle'))save(true);
}
function save(automatic=false) {
 try {localStorage.setItem(SAVE_KEY,serialize(state));$('#save-status').textContent=automatic?'Checkpoint saved':'Progress saved on this device';if(!automatic)announce('Progress saved on this device. Export a backup from the menu to keep a separate copy.');}
 catch(error){$('#save-status').textContent='Save failed · Export a backup';announce(`Could not save: ${error.message}`);}
}
function openModal(name) {
 clearHeld();returnFocus=document.activeElement;modal=name;$('#menu-panel').hidden=name!=='menu';$('#journal-panel').hidden=name!=='journal';$('#menu-toggle').setAttribute('aria-expanded',String(name==='menu'));$('#menu-status').textContent='';$('#new-confirm').hidden=true;
 $('#'+name+'-close').focus({preventScroll:true});
}
function closeModal() {modal=null;$('#menu-panel').hidden=true;$('#journal-panel').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');returnFocus?.focus?.({preventScroll:true});}
function clearHeld(){for(const {timer,repeat} of held.values()){clearTimeout(timer);clearInterval(repeat)}held.clear()}
function stopHeld(key){const h=held.get(key);if(h){clearTimeout(h.timer);clearInterval(h.repeat);held.delete(key)}}
function startHeld(key,dir){if(held.has(key)||modal||state.mode!=='explore')return;act(()=>move(state,dir));const entry={timer:null,repeat:null};entry.timer=setTimeout(()=>{entry.repeat=setInterval(()=>{if(modal||state.mode!=='explore'){stopHeld(key);return}act(()=>move(state,dir))},115)},170);held.set(key,entry)}
const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
document.addEventListener('keydown',event=>{
 if(modal){
  if(event.code==='Escape'){event.preventDefault();closeModal();return}
  if(event.code==='Tab'){const panel=$('#'+modal+'-panel');const focusable=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')].filter(n=>n.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
  return;
 }
 if(event.target instanceof HTMLInputElement)return;
 if(keys[event.code]){event.preventDefault();if(!event.repeat)startHeld(event.code,keys[event.code]);return}
 if(event.code==='Escape'||event.code==='KeyQ'){event.preventDefault();openModal(event.code==='KeyQ'?'journal':'menu');return}
 if(['KeyE','Space','Enter'].includes(event.code)){
  // Let Enter/Space activate a focused button natively; avoid double activations.
  if(['Space','Enter'].includes(event.code)&&event.target.closest('button'))return;
  event.preventDefault();if(!event.repeat)act(()=>interact(state));
 }
});
document.addEventListener('keyup',event=>stopHeld(event.code));window.addEventListener('blur',clearHeld);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearHeld()});
document.querySelectorAll('[data-dir]').forEach(button=>{
 button.addEventListener('pointerdown',event=>{event.preventDefault();if(event.isTrusted)button.setPointerCapture(event.pointerId);startHeld(`pointer-${event.pointerId}`,button.dataset.dir)});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>stopHeld(`pointer-${event.pointerId}`));
});
$('#interact').addEventListener('click',()=>act(()=>interact(state)));$('#dialogue-next').addEventListener('click',()=>act(()=>advanceDialogue(state)));
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>act(()=>battleAction(state,button.dataset.action,selectedTarget))));
$('#save-game').addEventListener('click',()=>save());$('#menu-toggle').addEventListener('click',()=>modal?closeModal():openModal('menu'));$('#menu-close').addEventListener('click',closeModal);$('#journal-toggle').addEventListener('click',()=>openModal('journal'));$('#journal-close').addEventListener('click',closeModal);
for(const name of ['menu','journal'])$('#'+name+'-panel').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});
$('#load-game').addEventListener('click',()=>{try{const saved=localStorage.getItem(SAVE_KEY);if(!saved)throw Error('No device save exists yet.');state=restore(saved);closeModal();sync();announce(state.message)}catch(error){announce(`Could not load: ${error.message}`)}});
$('#export-save').addEventListener('click',()=>{try{const data=serialize(state),blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download='ninja-tales-save.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Save exported. Keep the downloaded JSON file as your backup.')}catch(error){announce(`Could not export: ${error.message}`)}});
$('#import-save').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>50000)throw Error('Save file must be under 50 KB.');const imported=restore(await file.text());state=imported;closeModal();sync();announce('Backup imported. Choose Save progress to keep it on this device.')}catch(error){announce(`Could not import: ${error.message}`)}finally{event.target.value=''}});
$('#new-game').addEventListener('click',()=>{$('#new-confirm').hidden=false;$('#cancel-new').focus()});$('#cancel-new').addEventListener('click',()=>{$('#new-confirm').hidden=true;$('#new-game').focus()});
$('#confirm-new').addEventListener('click',()=>{state=createGame();selectedTarget=0;closeModal();sync();announce('A new adventure has begun. Your previous device save remains until you save again.');$('#save-status').textContent='New adventure · not yet saved'});
$('#reduced-motion').checked=reducedMotion;$('#reduced-motion').addEventListener('change',event=>{reducedMotion=event.target.checked;sync()});
function frame(now){if(!document.hidden&&!modal&&state.mode!=='battle'&&now-lastPaint>66){render(ctx,state,reducedMotion?0:now);lastPaint=now}requestAnimationFrame(frame)}
// Narrow screens get a camera viewport, never a CSS crop that can hide the player.
new ResizeObserver(([entry])=>{
 const width=entry.contentRect.width, height=entry.contentRect.height;
 if(!width||!height)return;
 canvas.width=width<540?384:768;canvas.height=Math.round(canvas.width*height/width);
 ctx.imageSmoothingEnabled=false;render(ctx,state,reducedMotion?0:performance.now());
}).observe($('.viewport'));
sync();announce(initialMessage||state.message);requestAnimationFrame(frame);
