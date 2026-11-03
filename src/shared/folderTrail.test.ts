import { describe, expect, it } from 'vitest'
import { folderTrail } from './folderTrail'

describe('folderTrail', () => {
  it('lists every folder from the project down to the one shown', () => {
    expect(folderTrail('E:\\', 'E:\\PersonalRepo\\o-bros')).toEqual([
      { name: 'E:', path: 'E:\\' },
      { name: 'PersonalRepo', path: 'E:\\PersonalRepo' },
      { name: 'o-bros', path: 'E:\\PersonalRepo\\o-bros' }
    ])
    expect(folderTrail('/home/me/work', '/home/me/work/api')).toEqual([
      { name: 'work', path: '/home/me/work' },
      { name: 'api', path: '/home/me/work/api' }
    ])
  })

  it('shows just the project when it is the folder shown', () => {
    expect(folderTrail('E:\\PersonalRepo', 'E:\\PersonalRepo')).toEqual([{ name: 'PersonalRepo', path: 'E:\\PersonalRepo' }])
  })

  it('shows only the folder when it is outside the project', () => {
    expect(folderTrail('E:\\PersonalRepo', 'D:\\other')).toEqual([{ name: 'other', path: 'D:\\other' }])
    expect(folderTrail(null, 'D:\\other')).toEqual([{ name: 'other', path: 'D:\\other' }])
  })
})
