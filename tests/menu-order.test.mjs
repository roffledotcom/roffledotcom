import assert from 'node:assert/strict';
import test from 'node:test';
import { moveMenuItem, restoreMenuOrder } from '../src/lib/menu-order.mjs';
test('menu preferences recover from stale, duplicate and invalid saved entries', () => {
  const defaults = ['overview', 'posts', 'reports', 'settings'];
  assert.deepEqual(restoreMenuOrder(['reports', 'removed', 'reports', 'posts'], defaults), ['reports', 'posts', 'overview', 'settings']);
  assert.deepEqual(restoreMenuOrder({ broken: true }, defaults), defaults);
});
test('drag insertion moves up and down without losing items or mutating the source', () => {
  const order = ['overview', 'posts', 'reports', 'settings'];
  assert.deepEqual(moveMenuItem(order, 'overview', 'reports', true), ['posts', 'reports', 'overview', 'settings']);
  assert.deepEqual(moveMenuItem(order, 'settings', 'posts', false), ['overview', 'settings', 'posts', 'reports']);
  assert.deepEqual(moveMenuItem(order, 'settings', 'overview', false), ['settings', 'overview', 'posts', 'reports']);
  assert.deepEqual(moveMenuItem(order, 'posts', 'posts'), order);
  assert.deepEqual(moveMenuItem(order, 'missing', 'posts'), order);
  assert.deepEqual(order, ['overview', 'posts', 'reports', 'settings']);
});
