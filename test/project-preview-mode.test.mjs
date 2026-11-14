import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canScrollProjectPreview } from '../public/voyager/project-preview-mode.mjs';

test('only exact JPG page screenshots scroll', () => {
  assert.equal(canScrollProjectPreview('/api/section-content/image?name=seed-project-porto.jpg', 800, 1500), true);
  assert.equal(canScrollProjectPreview('/api/section-content/image?name=seed-project-porto-mobile.jpg', 320, 1600, true), true);
  assert.equal(canScrollProjectPreview('/api/section-content/image?name=seed-project-porto.svg', 800, 1500), false);
  assert.equal(canScrollProjectPreview('/api/v1/uploads/photo.jpg', 800, 600), false);
  assert.equal(canScrollProjectPreview('/api/v1/uploads/photo.png', 800, 1500), false);
  assert.equal(canScrollProjectPreview('/api/v1/uploads/photo.jpg', 800, 1500, true), false);
});
