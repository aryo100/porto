import assert from 'node:assert/strict'
import { test } from 'node:test'
import { imageUrl } from '../lib/section-content.ts'

test('uploaded project images use distinct cache paths', () => {
  assert.equal(imageUrl('/api/v1/uploads/seed-project-porto.jpg'), '/api/section-content/image/seed-project-porto.jpg')
  assert.equal(imageUrl('/api/v1/uploads/seed-project-control.jpg'), '/api/section-content/image/seed-project-control.jpg')
  assert.notEqual(imageUrl('/api/v1/uploads/seed-project-porto.jpg'), imageUrl('/api/v1/uploads/seed-project-control.jpg'))
})
