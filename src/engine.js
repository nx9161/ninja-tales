import { MAPS, isWalkable, getInteractable } from './world.js';

// All transitions are synchronous and deterministic. Rendering and storage live outside this module.
export const SAVE_VERSION = 1;
export const ITEMS = Object.freeze({
  salve: { name: 'Healing salve', description: 'Restore 28 HP.', price: 12 },
  ether: { name: 'Chakra tea', description: 'Restore 12 chakra.', price: 15 },
});
export const ACTIONS = Object.freeze({
  strike: { name: 'Strike', description: 'A reliable physical attack.' },
  jutsu: { name: 'Wind thread', description: 'Spend 6 chakra for a piercing attack.', cost: 6 },
  guard: { name: 'Guard', description: 'Reduce damage during the next enemy turn by 70%.' },
  focus: { name: 'Focus', description: 'Recover 8 chakra; leave yourself exposed.' },
  item: { name: 'Salve', description: 'Restore 28 HP to the acting member.' },
  flee: { name: 'Retreat', description: 'Leave training safely and recover your party.' },
});
const DIRECTIONS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const ok = (state, message) => { if (message) state.message = message; return { ok: true, message: state.message }; };
const fail = (message) => ({ ok: false, message });

function makeMember(id) {
  const aya = id === 'aya';
  return { id, name: aya ? 'Aya' : 'Ren', level: 1, xp: 0, hp: aya ? 36 : 44, maxHp: aya ? 36 : 44,
    chakra: aya ? 28 : 24, maxChakra: aya ? 28 : 24, attack: aya ? 9 : 11,
    defense: aya ? 3 : 4, jutsu: [aya ? 'Water needle' : 'Wind thread'] };
}

export function createGame() {
  return { version: SAVE_VERSION, mapId: 'village', player: { x: 24, y: 29, facing: 'up' },
    mode: 'explore', party: [makeMember('ren')], inventory: { salve: 3, ether: 2 }, gold: 40,
    quest: { stage: 0 }, dialogue: null, battle: null,
    message: 'A new morning in Leafwood. Visit the instructor inside the academy.' };
}

export function move(state, direction) {
  if (state.mode !== 'explore') return fail('Finish the current encounter first.');
  if (!Object.hasOwn(DIRECTIONS, direction)) return fail('Unknown direction.');
  const delta = DIRECTIONS[direction];
  state.player.facing = direction;
  const x = state.player.x + delta[0], y = state.player.y + delta[1];
  if (!isWalkable(state.mapId, x, y)) return fail('The way is blocked.');
  state.player.x = x; state.player.y = y;
  return ok(state);
}

function say(state, speaker, lines, effect = null) {
  state.mode = 'dialogue';
  state.dialogue = { speaker, lines, index: 0, effect };
  return ok(state, lines[0]);
}

function healParty(state) {
  for (const member of state.party) { member.hp = member.maxHp; member.chakra = member.maxChakra; }
}

function transition(state, poi) {
  const target = typeof poi.target === 'object' ? poi.target.mapId : poi.target;
  const map = MAPS[target];
  if (!map) return fail('This destination is not available in the current slice.');
  const spawn = poi.spawn || (typeof poi.target === 'object' ? poi.target : map.spawn);
  const x = Array.isArray(spawn) ? spawn[0] : spawn?.x;
  const y = Array.isArray(spawn) ? spawn[1] : spawn?.y;
  if (!isWalkable(target, x, y)) return fail('The destination entrance is blocked.');
  state.mapId = target; state.player = { x, y, facing: poi.facing || spawn?.facing || 'down' };
  return ok(state, `Entered ${map.name}.`);
}

export function interact(state) {
  if (state.mode === 'dialogue') return advanceDialogue(state);
  if (state.mode !== 'explore') return fail('Choose a battle action.');
  const poi = getInteractable(state.mapId, state.player.x, state.player.y, state.player.facing);
  if (!poi) return ok(state, 'Face a person, doorway, or sign and press Action.');
  if (poi.target) return transition(state, poi);
  const stage = state.quest.stage;
  switch (poi.id) {
    case 'instructor':
      if (stage === 0) return say(state, poi.name, ['Every journey starts with preparation. Today you will learn to work as a team.', 'Collect the training supplies from the shop, then return here.'], 'accept');
      if (stage === 1) return say(state, poi.name, ['The shopkeeper has your training supplies. Visit the shop before our lesson.']);
      if (stage === 2) return say(state, poi.name, ['Prepared already? Good. Aya will join you for the field exercise.', 'Find the trainee at the eastern practice yard. Read their intent: guard against heavy attacks, then strike together.'], 'recruit');
      if (stage === 3) return say(state, poi.name, ['Your partner is ready. Speak to the trainee in the eastern practice yard.']);
      if (stage === 4) return say(state, poi.name, ['You watched your opponent and trusted your partner. That is the beginning of good teamwork.', 'Training complete! Take 30 coins and two healing salves. New stories will arrive in a later milestone.'], 'complete');
      return say(state, poi.name, ['Your first field lesson is complete. You can explore the village or repeat practice without earning duplicate rewards.']);
    case 'supply':
      if (stage === 1) return say(state, poi.name, ['The instructor sent you? Your training pack is ready.', 'Two extra salves and a flask of chakra tea. Return to the academy when you are ready.'], 'supplies');
      return say(state, poi.name, ['A healing salve costs 12 coins. Continue this conversation to buy one.'], 'buy-salve');
    case 'healer':
    case 'bed':
      return say(state, poi.name || 'Rest', ['Take a breath. Your entire party will recover HP and chakra.'], 'rest');
    case 'trainee':
      if (stage < 3) return say(state, poi.name, ['Talk to the instructor and prepare your team before we practice.']);
      return say(state, poi.name, ['Ready? Watch our intentions and use your chakra carefully.', 'Training begins. You can retreat safely if you need to recover.'], 'training');
    case 'gate':
      return say(state, poi.name || 'Village gate', ['The road beyond Leafwood is reserved for the next playable milestone. Your current assignment is inside the village.']);
    default:
      return say(state, poi.name || 'Leafwood', Array.isArray(poi.text) ? poi.text : [poi.text || 'A quiet corner of the village.']);
  }
}

export function advanceDialogue(state) {
  if (state.mode !== 'dialogue' || !state.dialogue) return fail('There is no conversation to continue.');
  const dialogue = state.dialogue;
  if (dialogue.index + 1 < dialogue.lines.length) { dialogue.index++; return ok(state, dialogue.lines[dialogue.index]); }
  state.mode = 'explore'; state.dialogue = null;
  switch (dialogue.effect) {
    case 'accept': if (state.quest.stage === 0) state.quest.stage = 1; break;
    case 'supplies':
      if (state.quest.stage === 1) { state.quest.stage = 2; state.inventory.salve = Math.min(999, state.inventory.salve + 2); state.inventory.ether = Math.min(999, state.inventory.ether + 1); }
      break;
    case 'recruit':
      if (state.quest.stage === 2) { state.quest.stage = 3; state.party.push(makeMember('aya')); healParty(state); }
      break;
    case 'complete':
      if (state.quest.stage === 4) { state.quest.stage = 5; state.gold = Math.min(999999, state.gold + 30); state.inventory.salve = Math.min(999, state.inventory.salve + 2); }
      break;
    case 'rest': healParty(state); return ok(state, 'Rested. The party is fully recovered.');
    case 'buy-salve':
      if (state.gold < ITEMS.salve.price) return ok(state, 'Not enough coins. Rest at home or the clinic for free.');
      if (state.inventory.salve >= 999) return ok(state, 'Your bag is full.');
      state.gold -= ITEMS.salve.price; state.inventory.salve++;
      return ok(state, 'Bought one healing salve for 12 coins.');
    case 'training': return startTraining(state);
  }
  return ok(state, 'Conversation complete.');
}

function startTraining(state) {
  if (!state.party.some(member => member.hp > 0)) { healParty(state); }
  state.mode = 'battle';
  state.battle = { encounterId: 'yard-training', turn: 1, actorIndex: state.party.findIndex(member => member.hp > 0),
    enemies: [
      { id: 'trainee', name: 'Practice leader', hp: 64, maxHp: 64, attack: 10, defense: 3, intent: 'strike' },
      { id: 'partner', name: 'Practice partner', hp: 40, maxHp: 40, attack: 8, defense: 2, intent: 'guard' },
    ], log: ['Read enemy intentions before choosing your action.'], guarded: [], rewardEligible: state.quest.stage === 3 };
  return ok(state, `${state.party[state.battle.actorIndex].name}'s turn.`);
}

function record(battle, text) { battle.log.push(text); if (battle.log.length > 12) battle.log.shift(); }

function grantXp(member, amount) {
  member.xp += amount;
  while (member.level < 50 && member.xp >= member.level * 30) {
    member.xp -= member.level * 30; member.level++; member.maxHp += 6; member.maxChakra += 3;
    member.attack += 2; member.defense++; member.hp = member.maxHp; member.chakra = member.maxChakra;
  }
}

function finishBattle(state, outcome) {
  const battle = state.battle;
  let text;
  if (outcome === 'victory') {
    if (battle.rewardEligible && state.quest.stage === 3) {
      state.quest.stage = 4; state.gold = Math.min(999999, state.gold + 20); state.party.forEach(member => grantXp(member, 35));
      text = 'Victory! Each teammate gains 35 XP. Earned 20 coins. Report to the academy instructor.';
    } else text = 'Practice victory! Your lesson rewards have already been earned.';
  } else {
    healParty(state);
    text = outcome === 'flee' ? 'You withdrew safely. Your party recovered; speak to the trainee when ready.' : 'Your team was defeated. The instructor helped you recover. Try again with guard and chakra techniques.';
  }
  state.mode = 'explore'; state.battle = null;
  return ok(state, text);
}

function enemyTurn(state) {
  const battle = state.battle;
  for (const [index, enemy] of battle.enemies.entries()) {
    if (enemy.hp <= 0) continue;
    if (enemy.intent === 'guard') { record(battle, `${enemy.name} holds a defensive stance.`); continue; }
    const living = state.party.filter(member => member.hp > 0);
    if (!living.length) break;
    const victim = living[(battle.turn + index - 1) % living.length];
    const multiplier = enemy.intent === 'heavy' ? 2.2 : 1;
    let damage = Math.max(1, Math.floor(enemy.attack * multiplier) - victim.defense);
    if (battle.guarded.includes(victim.id)) damage = Math.max(1, Math.floor(damage * 0.3));
    victim.hp = Math.max(0, victim.hp - damage);
    record(battle, `${enemy.name} uses ${enemy.intent === 'heavy' ? 'a heavy blow' : 'a strike'}: ${victim.name} takes ${damage}.`);
  }
  if (!state.party.some(member => member.hp > 0)) return finishBattle(state, 'defeat');
  battle.turn++; battle.guarded = []; battle.actorIndex = state.party.findIndex(member => member.hp > 0);
  for (const [index, enemy] of battle.enemies.entries()) enemy.intent = ['strike', 'heavy', 'guard'][(battle.turn - 1 + index * 2) % 3];
  return ok(state, `${state.party[battle.actorIndex].name}'s turn. Check the enemy intent.`);
}

export function battleAction(state, action, targetIndex = 0) {
  if (state.mode !== 'battle' || !state.battle) return fail('There is no active battle.');
  if (!Object.hasOwn(ACTIONS, action)) return fail('Unknown battle action.');
  if (action === 'flee') return finishBattle(state, 'flee');
  const battle = state.battle, actor = state.party[battle.actorIndex];
  if (!actor || actor.hp <= 0) return fail('This teammate cannot act.');
  if (action === 'strike' || action === 'jutsu') {
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= battle.enemies.length || battle.enemies[targetIndex].hp <= 0) return fail('Choose a standing opponent.');
    if (action === 'jutsu' && actor.chakra < ACTIONS.jutsu.cost) return fail('Not enough chakra. Focus or choose another action.');
    const enemy = battle.enemies[targetIndex];
    if (action === 'jutsu') actor.chakra -= ACTIONS.jutsu.cost;
    let damage = Math.max(1, actor.attack * (action === 'jutsu' ? 2 : 1) - (action === 'jutsu' ? 0 : enemy.defense));
    if (enemy.intent === 'guard') damage = Math.max(1, Math.floor(damage / 2));
    enemy.hp = Math.max(0, enemy.hp - damage);
    record(battle, `${actor.name} uses ${action === 'jutsu' ? actor.jutsu[0] : 'Strike'}: ${enemy.name} takes ${damage}.`);
  } else if (action === 'guard') {
    battle.guarded.push(actor.id); record(battle, `${actor.name} guards against the next enemy turn.`);
  } else if (action === 'focus') {
    const before = actor.chakra; actor.chakra = Math.min(actor.maxChakra, actor.chakra + 8);
    record(battle, `${actor.name} focuses and restores ${actor.chakra - before} chakra.`);
  } else if (action === 'item') {
    if (state.inventory.salve <= 0) return fail('No healing salves remain.');
    if (actor.hp === actor.maxHp) return fail('This teammate already has full HP.');
    state.inventory.salve--; actor.hp = Math.min(actor.maxHp, actor.hp + 28);
    record(battle, `${actor.name} uses a healing salve.`);
  }
  if (battle.enemies.every(enemy => enemy.hp === 0)) return finishBattle(state, 'victory');
  let next = battle.actorIndex + 1;
  while (next < state.party.length && state.party[next].hp <= 0) next++;
  if (next < state.party.length) { battle.actorIndex = next; return ok(state, `${state.party[next].name}'s turn.`); }
  return enemyTurn(state);
}

export function useItem(state, itemId) {
  if (state.mode !== 'explore') return fail('Use items between encounters, or choose Salve in battle.');
  if (!Object.hasOwn(ITEMS, itemId)) return fail('Unknown item.');
  if (state.inventory[itemId] <= 0) return fail('You have none of this item.');
  const stat = itemId === 'salve' ? 'hp' : 'chakra', max = itemId === 'salve' ? 'maxHp' : 'maxChakra';
  const member = state.party.find(member => member[stat] < member[max]);
  if (!member) return fail('Your entire party is already fully restored.');
  state.inventory[itemId]--; member[stat] = Math.min(member[max], member[stat] + (itemId === 'salve' ? 28 : 12));
  return ok(state, `${ITEMS[itemId].name} restored ${member.name}.`);
}

function requireThat(condition, message) { if (!condition) throw new Error(message); }
function integer(value, min, max) { return Number.isInteger(value) && value >= min && value <= max; }
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function serialize(state) {
  if (state.mode !== 'explore') throw new Error('Finish the conversation or battle before saving.');
  // Run our reader on writes too, preventing invalid in-memory state from replacing a valid save.
  const text = JSON.stringify(state);
  restore(text);
  return text;
}

export function restore(text) {
  requireThat(typeof text === 'string' && text.length <= 50000, 'Save file is too large or invalid.');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Save file is not valid JSON.'); }
  requireThat(plain(value) && value.version === SAVE_VERSION, 'Unsupported save version.');
  requireThat(value.mode === 'explore' && value.battle === null && value.dialogue === null, 'This save contains an unfinished encounter.');
  requireThat(Object.hasOwn(MAPS, value.mapId), 'Unknown saved location.');
  requireThat(plain(value.player), 'Invalid player position.');
  const map = MAPS[value.mapId];
  requireThat(integer(value.player.x, 0, map.width - 1) && integer(value.player.y, 0, map.height - 1)
    && Object.hasOwn(DIRECTIONS, value.player.facing) && isWalkable(value.mapId, value.player.x, value.player.y), 'Saved position is blocked or invalid.');
  requireThat(plain(value.quest) && integer(value.quest.stage, 0, 5), 'Invalid quest state.');
  requireThat(Array.isArray(value.party) && value.party.length >= 1 && value.party.length <= 4, 'Invalid party size.');
  const expectedIds = value.quest.stage >= 3 ? ['ren', 'aya'] : ['ren'];
  requireThat(value.party.length === expectedIds.length && value.party.every((member, index) => plain(member) && member.id === expectedIds[index]), 'The party does not match the story.');
  const party = value.party.map(member => {
    const base = makeMember(member.id);
    requireThat(integer(member.level, 1, 50) && integer(member.xp, 0, member.level * 30 - 1), 'Invalid character progression.');
    const expectedHp = base.maxHp + (member.level - 1) * 6, expectedChakra = base.maxChakra + (member.level - 1) * 3;
    requireThat(member.maxHp === expectedHp && member.maxChakra === expectedChakra
      && member.attack === base.attack + (member.level - 1) * 2 && member.defense === base.defense + member.level - 1, 'Invalid character stats.');
    requireThat(integer(member.hp, 0, expectedHp) && integer(member.chakra, 0, expectedChakra), 'Invalid HP or chakra.');
    return { ...base, level: member.level, xp: member.xp, hp: member.hp, maxHp: expectedHp, chakra: member.chakra,
      maxChakra: expectedChakra, attack: member.attack, defense: member.defense };
  });
  requireThat(party.some(member => member.hp > 0), 'The party needs a recoverable character.');
  requireThat(plain(value.inventory) && integer(value.inventory.salve, 0, 999) && integer(value.inventory.ether, 0, 999), 'Invalid inventory.');
  requireThat(integer(value.gold, 0, 999999), 'Invalid coin count.');
  // Construct only allowlisted fields. Imported strings, prototypes and arbitrary flags never enter the game.
  return { version: SAVE_VERSION, mapId: value.mapId, player: { x: value.player.x, y: value.player.y, facing: value.player.facing },
    mode: 'explore', party, inventory: { salve: value.inventory.salve, ether: value.inventory.ether }, gold: value.gold,
    quest: { stage: value.quest.stage }, dialogue: null, battle: null, message: 'Progress loaded. Welcome back to Leafwood.' };
}
