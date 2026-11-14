import assert from 'node:assert/strict';
import { test } from 'node:test';
import { archiveScrollMode, archiveAdvanceTarget, canControlExperienceScroll } from '../public/voyager/archive-scroll.js';

test('photo sequence holds until complete, then the next downward input advances', () => {
  const crossing = { bypass: false, offset: 881, delta: 120, recordStop: 881, journeyStop: 1521 };
  assert.equal(archiveScrollMode({ ...crossing, unlocked: false, complete: false }), 'hold');
  assert.equal(archiveScrollMode({ ...crossing, unlocked: false, complete: true }), 'advance');
  assert.equal(archiveScrollMode({ ...crossing, unlocked: true, complete: false }), 'advance');
  assert.equal(archiveScrollMode({ ...crossing, offset: 1521, unlocked: true, complete: false }), null);
  assert.equal(archiveAdvanceTarget(881, 120, 1521), 1001);
  assert.equal(archiveAdvanceTarget(881, 7200, 1521), 1521);
});

test('experience keeps its scroll controller after the photo scene changes', () => {
  assert.equal(canControlExperienceScroll(true, { bypass: false, archiveReleased: true, sceneReady: false }), true);
  assert.equal(canControlExperienceScroll(true, { bypass: false, archiveReleased: false, sceneReady: false }), false);
  assert.equal(canControlExperienceScroll(false, { bypass: false, archiveReleased: true, sceneReady: true }), false);
});
