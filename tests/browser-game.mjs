import { test, expect } from '@playwright/test';
import { MAPS, isWalkable, getInteractable } from '../src/world.js';

const directionKeys = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' };
const deltas = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

async function location(page) {
  return page.locator('#game').evaluate(canvas => ({
    mapId: canvas.dataset.map, x: Number(canvas.dataset.x), y: Number(canvas.dataset.y),
    mode: canvas.dataset.mode, stage: Number(canvas.dataset.stage),
  }));
}

function pathToInteraction(mapId, x, y, id) {
  const queue = [{ x, y, path: [] }], seen = new Set([`${x},${y}`]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const point = queue[cursor];
    for (const direction of Object.keys(deltas)) {
      if (getInteractable(mapId, point.x, point.y, direction)?.id === id) {
        return { path: point.path, facing: direction };
      }
    }
    for (const [direction, [dx, dy]] of Object.entries(deltas)) {
      const nx = point.x + dx, ny = point.y + dy, key = `${nx},${ny}`;
      if (!seen.has(key) && isWalkable(mapId, nx, ny)) {
        seen.add(key); queue.push({ x: nx, y: ny, path: [...point.path, direction] });
      }
    }
  }
  throw new Error(`No reachable interaction ${mapId}/${id}`);
}

async function talkTo(page, id) {
  let current = await location(page);
  const route = pathToInteraction(current.mapId, current.x, current.y, id);
  for (const direction of route.path) {
    const [dx, dy] = deltas[direction];
    await page.keyboard.press(directionKeys[direction]);
    current.x += dx; current.y += dy;
    await expect(page.locator('#game')).toHaveAttribute('data-x', String(current.x));
    await expect(page.locator('#game')).toHaveAttribute('data-y', String(current.y));
  }
  await page.keyboard.press(directionKeys[route.facing]);
  await page.locator('#interact').click();
}

async function finishDialogue(page) {
  for (let n = 0; n < 8 && await page.locator('#dialogue-panel').isVisible(); n++) {
    await page.locator('#dialogue-next').click();
  }
  await expect(page.locator('#dialogue-panel')).toBeHidden();
}

async function enter(page, mapId) {
  await talkTo(page, `enter-${mapId}`);
  await expect(page.locator('#game')).toHaveAttribute('data-map', mapId);
}

async function leave(page) {
  const { mapId } = await location(page);
  await talkTo(page, `leave-${mapId}`);
  await expect(page.locator('#game')).toHaveAttribute('data-map', 'village');
}

async function openMenu(page) {
  if (!await page.locator('#menu-panel').isVisible()) await page.locator('#menu-toggle').click();
  await expect(page.locator('#menu-panel')).toBeVisible();
}

async function closeMenu(page) {
  if (await page.locator('#menu-panel').isVisible()) await page.keyboard.press('Escape');
  await expect(page.locator('#menu-panel')).toBeHidden();
}

async function reachTraining(page) {
  await enter(page, 'academy');
  await talkTo(page, 'instructor');
  await finishDialogue(page);
  await expect(page.locator('#game')).toHaveAttribute('data-stage', '1');
  await leave(page);
  await enter(page, 'shop');
  await talkTo(page, 'supply');
  await finishDialogue(page);
  await expect(page.locator('#game')).toHaveAttribute('data-stage', '2');
  await leave(page);
  await enter(page, 'academy');
  await talkTo(page, 'instructor');
  await finishDialogue(page);
  await expect(page.locator('#game')).toHaveAttribute('data-stage', '3');
  await expect(page.locator('#party-list')).toContainText('Aya');
  await leave(page);
  await talkTo(page, 'trainee');
  await finishDialogue(page);
  await expect(page.locator('#battle-panel')).toBeVisible();
}

test('complete the original quest through real controls, save, and reload', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#game')).toHaveAttribute('data-mode', 'explore');
  await page.screenshot({path:testInfo.outputPath('village.png'),fullPage:true});
  await reachTraining(page);
  await page.screenshot({path:testInfo.outputPath('battle.png'),fullPage:true});
  // Drive a real two-member turn order, including focus and guarding.
  await page.locator('[data-action="guard"]').click();
  await page.locator('[data-action="focus"]').click();
  for (let turn = 0; turn < 40 && await page.locator('#battle-panel').isVisible(); turn++) {
    const availableTargets = page.locator('[data-target]:not([disabled])');
    if (await availableTargets.count()) await availableTargets.first().click();
    const jutsu = page.locator('[data-action="jutsu"]');
    if (await jutsu.isEnabled()) await jutsu.click();
    else await page.locator('[data-action="strike"]').click();
  }
  await expect(page.locator('#battle-panel')).toBeHidden();
  await expect(page.locator('#game')).toHaveAttribute('data-stage', '4');
  await enter(page, 'academy');
  await talkTo(page, 'instructor');
  await finishDialogue(page);
  await expect(page.locator('#game')).toHaveAttribute('data-stage', '5');
  const before = await location(page);
  await page.locator('#save-game').click();
  await expect(page.locator('#status')).toContainText(/sav/i);
  await page.reload();
  await expect(page.locator('#game')).toHaveAttribute('data-stage', '5');
  await expect(page.locator('#game')).toHaveAttribute('data-map', before.mapId);
  await expect(page.locator('#game')).toHaveAttribute('data-x', String(before.x));
  await expect(page.locator('#party-list')).toContainText('Aya');
  await page.screenshot({path:testInfo.outputPath('quest-complete.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('export and valid import round-trip, new adventure confirmation preserves save', async ({page})=>{
 await page.goto('/');
 await page.locator('#save-game').click();
 await openMenu(page);
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#export-save').click();
 const download=await downloadPromise;
 const path=await download.path();
 expect(download.suggestedFilename()).toBe('ninja-tales-save.json');
 await page.locator('#new-game').click();
 await expect(page.locator('#new-confirm')).toBeVisible();
 await page.locator('#cancel-new').click();
 await expect(page.locator('#new-confirm')).toBeHidden();
 await page.locator('#import-save').setInputFiles(path);
 await expect(page.locator('#menu-panel')).toBeHidden();
 await expect(page.locator('#status')).toContainText('Backup imported');
 await expect(page.locator('#game')).toHaveAttribute('data-stage','0');
});

test('storage failure keeps the game playable and reports failure', async ({page})=>{
 await page.addInitScript(()=>{
  Storage.prototype.setItem=function(){throw new DOMException('Storage unavailable','QuotaExceededError')};
 });
 await page.goto('/');
 await page.locator('#save-game').click();
 await expect(page.locator('#status')).toContainText('Could not save');
 const before=await location(page);
 await page.keyboard.press('ArrowUp');
 const after=await location(page);
 expect(after.y).toBe(before.y-1);
});

test('interiors are usable and corrupt import preserves the active game', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toHaveAttribute('data-mode', 'explore');
  for (const [map, interaction] of [['home', 'bed'], ['clinic', 'healer']]) {
    await enter(page, map);
    await talkTo(page, interaction);
    await finishDialogue(page);
    await leave(page);
  }
  const before = await location(page);
  await openMenu(page);
  await page.locator('#import-save').setInputFiles({ name: 'broken-save.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999}') });
  await expect(page.locator('#status')).toContainText(/invalid|unsupported|could not|unable|import failed/i);
  expect(await location(page)).toEqual(before);
  await closeMenu(page);
});

test('menu and dialogue block world movement, controls fit the viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toHaveAttribute('data-mode', 'explore');
  const before = await location(page);
  await openMenu(page);
  await page.keyboard.press('ArrowUp');
  expect(await location(page)).toEqual(before);
  await closeMenu(page);
  await talkTo(page, 'notice');
  await expect(page.locator('#dialogue-panel')).toBeVisible();
  const talking = await location(page);
  await page.keyboard.press('ArrowDown');
  expect(await location(page)).toEqual(talking);
  await finishDialogue(page);
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(width.document).toBeLessThanOrEqual(width.viewport + 1);
  await expect(page.locator('#interact')).toBeVisible();
  const control = await page.locator('[data-dir="up"]').boundingBox();
  expect(control.width).toBeGreaterThanOrEqual(44);
  expect(control.height).toBeGreaterThanOrEqual(44);
});

test('pointer cancellation and lost focus release movement', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game')).toHaveAttribute('data-mode', 'explore');
  const control = page.locator('[data-dir="up"]');
  await control.dispatchEvent('pointerdown', { pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true });
  await control.dispatchEvent('pointercancel', { pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true });
  const released = await location(page);
  await page.waitForTimeout(350);
  expect(await location(page)).toEqual(released);
  await page.keyboard.down('ArrowDown');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('ArrowDown');
  const blurred = await location(page);
  await page.waitForTimeout(350);
  expect(await location(page)).toEqual(blurred);
});
