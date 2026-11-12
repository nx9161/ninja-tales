import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isWalkable, getInteractable } from '../src/world.js';
import { createGame, move, interact, advanceDialogue, battleAction, useItem, serialize, restore } from '../src/engine.js';

function facePoi(state, mapId, id) {
  const map = MAPS[mapId];
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    if (!isWalkable(mapId, x, y)) continue;
    for (const facing of ['up', 'down', 'left', 'right']) {
      if (getInteractable(mapId, x, y, facing)?.id === id) {
        state.mapId = mapId; state.player = { x, y, facing }; return;
      }
    }
  }
  assert.fail(`No accessible interaction for ${mapId}/${id}`);
}
function talk(state, mapId, id) {
  facePoi(state, mapId, id); assert.equal(interact(state).ok, true);
  let bound = 0;
  while (state.mode === 'dialogue' && bound++ < 20) advanceDialogue(state);
  assert.ok(bound < 20, 'Dialogue must terminate');
}
function teamReady() {
  const state = createGame();
  talk(state, 'academy', 'instructor'); talk(state, 'shop', 'supply'); talk(state, 'academy', 'instructor');
  assert.equal(state.quest.stage, 3); return state;
}
function startBattle(state = teamReady()) { talk(state, 'village', 'trainee'); assert.equal(state.mode, 'battle'); return state; }
function win(state) {
  let limit = 0;
  while (state.mode === 'battle' && limit++ < 100) {
    const actor = state.party[state.battle.actorIndex];
    const target = state.battle.enemies.findIndex(enemy => enemy.hp > 0);
    const action = actor.hp < 14 && state.inventory.salve ? 'item' : actor.chakra >= 6 ? 'jutsu' : 'strike';
    assert.equal(battleAction(state, action, target).ok, true);
  }
  assert.ok(limit < 100); assert.equal(state.quest.stage >= 4, true);
}

test('new game uses a walkable spawn and movement obeys terrain collision', () => {
  const state = createGame(); assert.ok(isWalkable(state.mapId, state.player.x, state.player.y));
  state.player = { x: 2, y: 15, facing: 'right' };
  assert.equal(move(state, 'left').ok, false); assert.equal(state.player.x, 2); assert.equal(state.player.facing, 'left');
  assert.equal(move(state, 'right').ok, true); assert.equal(state.player.x, 3);
  assert.equal(move(state, '__proto__').ok, false);
});

test('doors enter and leave every interior at a valid spawn', () => {
  for (const id of ['academy', 'home', 'shop', 'clinic']) {
    const state = createGame(); facePoi(state, 'village', `enter-${id}`); interact(state);
    assert.equal(state.mapId, id); assert.equal(state.player.facing, 'up'); assert.ok(isWalkable(id, state.player.x, state.player.y));
    facePoi(state, id, `leave-${id}`); interact(state); assert.equal(state.mapId, 'village');
    assert.ok(isWalkable('village', state.player.x, state.player.y));
  }
});

test('quest cannot skip supplies; recruitment and rewards happen once', () => {
  const state = createGame(); talk(state, 'village', 'trainee'); assert.equal(state.mode, 'explore'); assert.equal(state.quest.stage, 0);
  talk(state, 'academy', 'instructor'); assert.equal(state.quest.stage, 1);
  talk(state, 'academy', 'instructor'); assert.equal(state.quest.stage, 1); assert.equal(state.party.length, 1);
  talk(state, 'shop', 'supply'); assert.equal(state.quest.stage, 2); assert.deepEqual(state.inventory, { salve: 5, ether: 3 });
  talk(state, 'academy', 'instructor'); assert.deepEqual(state.party.map(member => member.id), ['ren', 'aya']);
  talk(state, 'academy', 'instructor'); assert.equal(state.party.length, 2);
  startBattle(state); win(state); assert.equal(state.gold, 60); assert.equal(state.party[0].level, 2);
  talk(state, 'academy', 'instructor'); assert.equal(state.quest.stage, 5); assert.equal(state.gold, 90);
  talk(state, 'academy', 'instructor'); assert.equal(state.gold, 90);
  const xp = state.party.map(member => member.xp); startBattle(state); win(state);
  assert.equal(state.gold, 90); assert.deepEqual(state.party.map(member => member.xp), xp);
});

test('dialogue blocks movement and battle actions; effects wait until its final line', () => {
  const state = createGame(); facePoi(state, 'academy', 'instructor'); interact(state);
  assert.equal(state.quest.stage, 0); assert.equal(state.mode, 'dialogue');
  const before = structuredClone(state.player); assert.equal(move(state, 'down').ok, false);
  assert.deepEqual(state.player, before); assert.equal(battleAction(state, 'strike').ok, false);
  advanceDialogue(state); assert.equal(state.quest.stage, 0); advanceDialogue(state); assert.equal(state.quest.stage, 1);
});

test('invalid targets, actions, insufficient chakra and unnecessary items consume no turns or resources', () => {
  const state = startBattle(); state.party[0].chakra = 0;
  for (const [action, target] of [['jutsu', 0], ['strike', -1], ['strike', 4], ['strike', 0.5], ['item', 0], ['__proto__', 0]]) {
    const before = structuredClone(state); assert.equal(battleAction(state, action, target).ok, false); assert.deepEqual(state, before);
  }
});

test('each living member acts before the enemy round and focus restores bounded chakra', () => {
  const state = startBattle(); state.party[0].chakra = 20;
  battleAction(state, 'focus'); assert.equal(state.party[0].chakra, 24); assert.equal(state.battle.actorIndex, 1); assert.equal(state.battle.turn, 1);
  battleAction(state, 'strike'); assert.equal(state.battle.actorIndex, 0); assert.equal(state.battle.turn, 2);
  assert.equal(state.battle.enemies[0].intent, 'heavy');
});

test('guard reduces a telegraphed heavy attack without eliminating damage', () => {
  const guarded = startBattle(), exposed = structuredClone(guarded);
  for (const state of [guarded, exposed]) { state.battle.enemies[0].intent = 'heavy'; state.battle.enemies[1].hp = 0; }
  battleAction(guarded, 'guard'); battleAction(guarded, 'guard');
  battleAction(exposed, 'focus'); battleAction(exposed, 'focus');
  assert.ok(guarded.party[0].hp > exposed.party[0].hp); assert.ok(guarded.party[0].hp < guarded.party[0].maxHp);
});

test('defeat and retreat restore a retryable party without granting rewards', () => {
  const defeated = startBattle(); defeated.party.forEach(member => { member.hp = 1; });
  defeated.battle.enemies.forEach(enemy => { enemy.intent = 'heavy'; });
  battleAction(defeated, 'focus'); battleAction(defeated, 'focus');
  assert.equal(defeated.mode, 'explore'); assert.equal(defeated.quest.stage, 3); assert.equal(defeated.gold, 40);
  assert.ok(defeated.party.every(member => member.hp === member.maxHp));
  startBattle(defeated); battleAction(defeated, 'flee'); assert.equal(defeated.mode, 'explore'); assert.equal(defeated.quest.stage, 3);
});

test('items restore a wounded member and cannot waste charges outside battle', () => {
  const state = teamReady(); assert.equal(useItem(state, 'salve').ok, false); assert.equal(state.inventory.salve, 5);
  state.party[1].hp = 4; assert.equal(useItem(state, 'salve').ok, true); assert.equal(state.party[1].hp, 32); assert.equal(state.inventory.salve, 4);
  state.party[0].chakra = 0; assert.equal(useItem(state, 'ether').ok, true); assert.equal(state.party[0].chakra, 12);
  assert.equal(useItem(state, 'constructor').ok, false);
});

test('free rest fully recovers and shop cannot overdraw coins', () => {
  const state = createGame(); state.party[0].hp = 1; state.party[0].chakra = 0;
  talk(state, 'home', 'bed'); assert.equal(state.party[0].hp, state.party[0].maxHp); assert.equal(state.party[0].chakra, state.party[0].maxChakra);
  talk(state, 'shop', 'supply'); assert.equal(state.gold, 28); assert.equal(state.inventory.salve, 4);
  state.gold = 5; talk(state, 'shop', 'supply'); assert.equal(state.gold, 5); assert.equal(state.inventory.salve, 4);
});

test('save round-trip preserves durable progress and blocks unfinished encounters', () => {
  const state = teamReady(), loaded = restore(serialize(state));
  assert.deepEqual(loaded.party, state.party); assert.deepEqual(loaded.inventory, state.inventory); assert.deepEqual(loaded.quest, state.quest);
  startBattle(state); assert.throws(() => serialize(state), /Finish/); battleAction(state, 'flee');
  facePoi(state, 'academy', 'instructor'); interact(state); assert.throws(() => serialize(state), /Finish/);
});

test('save validation rejects corrupt, oversized, poisoned, invalid and non-finite gameplay state', () => {
  for (const text of ['', '{', 'null', '[]', 'x'.repeat(50001), '{"version":999}']) assert.throws(() => restore(text));
  const mutations = [s => { s.player.x = 2.5; }, s => { s.player.x = 999; }, s => { s.player.x = 0; },
    s => { s.player.facing = '__proto__'; }, s => { s.mapId = '__proto__'; }, s => { s.gold = Infinity; },
    s => { s.inventory.salve = -1; }, s => { s.party[0].hp = 9000; }, s => { s.party[0].maxHp = 9000; },
    s => { s.quest.stage = 3; }, s => { s.party = []; }, s => { s.mode = 'battle'; }];
  for (const mutate of mutations) { const state = createGame(); mutate(state); assert.throws(() => restore(JSON.stringify(state))); }
  const hostile = createGame(); hostile.party[0].name = '<script>alert(1)</script>'; hostile.extra = { __proto__: 'ignored' };
  const clean = restore(JSON.stringify(hostile)); assert.equal(clean.party[0].name, 'Ren'); assert.equal(clean.extra, undefined);
});
