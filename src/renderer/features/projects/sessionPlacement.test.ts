import { describe, expect, it } from 'vitest'
import { placeSessions } from './sessionPlacement'

const ROOT = 'C:/Work/CompanyRepo'
const FOLDERS = ['C:/Work/CompanyRepo/Web', 'C:/Work/CompanyRepo/Web/Admin', 'C:/Work/CompanyRepo/Api']

function session(id: string, cwd: string | null) {
  return { id, cwd }
}

describe('placeSessions', () => {
  it('puts a session under the folder that contains its working directory', () => {
    const placement = placeSessions([session('a', 'C:/Work/CompanyRepo/Api/src')], ROOT, FOLDERS)
    expect(placement.byFolderPath.get('C:/Work/CompanyRepo/Api')?.map((item) => item.id)).toEqual(['a'])
    expect(placement.atRoot).toEqual([])
  })

  it('prefers the deepest folder', () => {
    const placement = placeSessions([session('a', 'C:/Work/CompanyRepo/Web/Admin')], ROOT, FOLDERS)
    expect(placement.byFolderPath.has('C:/Work/CompanyRepo/Web')).toBe(false)
    expect(placement.byFolderPath.get('C:/Work/CompanyRepo/Web/Admin')?.length).toBe(1)
  })

  it('keeps a session of the root itself at the root', () => {
    const placement = placeSessions([session('a', ROOT)], ROOT, FOLDERS)
    expect(placement.atRoot.map((item) => item.id)).toEqual(['a'])
  })

  it('ignores sessions outside the root and sessions without a folder', () => {
    const placement = placeSessions([session('a', 'D:/Other'), session('b', null)], ROOT, FOLDERS)
    expect(placement.atRoot).toEqual([])
    expect(placement.byFolderPath.size).toBe(0)
  })

  it('leaves sessions of a project opened inside this one to that project', () => {
    const nested = 'C:/Work/CompanyRepo/Web'
    const placement = placeSessions([session('a', 'C:/Work/CompanyRepo/Web/src'), session('b', ROOT)], ROOT, FOLDERS, [nested])
    expect(placement.atRoot.map((item) => item.id)).toEqual(['b'])
    expect(placement.byFolderPath.size).toBe(0)
  })

  it('does not treat a sibling with the same prefix as inside the folder', () => {
    const placement = placeSessions([session('a', 'C:/Work/CompanyRepo/Web-Old')], ROOT, FOLDERS)
    expect(placement.atRoot.map((item) => item.id)).toEqual(['a'])
  })
})
