import { describe, expect, it } from 'vitest'
import { closestProject } from './closestProject'
import type { ProjectRoot } from './types'

const roots: ProjectRoot[] = [
  {
    name: 'PersonalRepo',
    path: 'E:\\PersonalRepo',
    branch: null,
    folders: [
      { name: 'o-bros', path: 'E:\\PersonalRepo\\o-bros', branch: null },
      { name: 'site', path: 'E:\\PersonalRepo\\site', branch: null }
    ]
  }
]

describe('closestProject', () => {
  it('prefers the folder over the root that contains it', () => {
    expect(closestProject('E:\\PersonalRepo\\o-bros\\src\\main', roots)).toEqual({
      name: 'o-bros',
      path: 'E:\\PersonalRepo\\o-bros'
    })
  })

  it('returns the root when the location is in no folder', () => {
    expect(closestProject('E:\\PersonalRepo\\notes', roots)?.name).toBe('PersonalRepo')
  })

  it('does not match a folder that only shares a name prefix', () => {
    expect(closestProject('E:\\PersonalRepo\\o-bros-old', roots)?.name).toBe('PersonalRepo')
  })

  it('returns null outside every root', () => {
    expect(closestProject('D:\\Scratch', roots)).toBeNull()
  })
})
