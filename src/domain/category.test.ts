import { describe, expect, it } from 'vitest'
import { SYSTEM_UNORGANIZED_CATEGORY_ID } from './category'

describe('SYSTEM_UNORGANIZED_CATEGORY_ID', () => {
  it('is the fixed id defined by Technical Architecture Proposal §3.3', () => {
    expect(SYSTEM_UNORGANIZED_CATEGORY_ID).toBe('system-unorganized')
  })
})
