import { describe, expect, it } from 'vitest'
import { fileIconName, folderIconName, mappedIconNames } from './fileIconNames'

const KNOWN = new Set([
  'file',
  'folder',
  'folder-open',
  'typescript',
  'typescript-react',
  'typescript-test',
  'typescript-def',
  'json',
  'package-json',
  'env',
  'readme',
  'svelte',
  'vite',
  'folder-src',
  'folder-src-open',
  'folder-tests',
  'folder-node'
])
const hasIcon = (name: string): boolean => KNOWN.has(name)

describe('fileIconName', () => {
  it('prefers a known file name, then the longest known extension', () => {
    expect(fileIconName('package.json', hasIcon)).toBe('package-json')
    expect(fileIconName('Button.test.tsx', hasIcon)).toBe('typescript-test')
    expect(fileIconName('types.d.ts', hasIcon)).toBe('typescript-def')
    expect(fileIconName('App.tsx', hasIcon)).toBe('typescript-react')
  })

  it('matches name families and icons named like the extension', () => {
    expect(fileIconName('.env.local', hasIcon)).toBe('env')
    expect(fileIconName('README.md', hasIcon)).toBe('readme')
    expect(fileIconName('vite.config.ts', hasIcon)).toBe('vite')
    expect(fileIconName('Page.svelte', hasIcon)).toBe('svelte')
  })

  it('falls back to the plain file icon', () => {
    expect(fileIconName('notes', hasIcon)).toBe('file')
    expect(fileIconName('photo.unknownext', hasIcon)).toBe('file')
  })
})

describe('folderIconName', () => {
  it('uses a named folder icon and its open form', () => {
    expect(folderIconName('src', false, hasIcon)).toBe('folder-src')
    expect(folderIconName('src', true, hasIcon)).toBe('folder-src-open')
    expect(folderIconName('__tests__', false, hasIcon)).toBe('folder-tests')
    expect(folderIconName('node_modules', true, hasIcon)).toBe('folder-node')
  })

  it('falls back to the plain folder icons', () => {
    expect(folderIconName('random', false, hasIcon)).toBe('folder')
    expect(folderIconName('random', true, hasIcon)).toBe('folder-open')
  })
})

describe('the name tables', () => {
  it('only name icons that exist in the icon set', async () => {
    const { icons } = await import('@iconify-json/catppuccin')
    const missing = mappedIconNames().filter((name) => icons.icons[name] === undefined && icons.aliases?.[name] === undefined)
    expect(missing).toEqual([])
    expect(icons.icons['folder-open']).toBeDefined()
  })
})
