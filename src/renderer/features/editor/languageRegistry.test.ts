import { EditorState } from '@codemirror/state'
import { ensureSyntaxTree } from '@codemirror/language'
import { describe, expect, it } from 'vitest'
import { findLanguageForFile } from './languageRegistry'

describe('findLanguageForFile', () => {
  it('finds the env language for dot env files', () => {
    expect(findLanguageForFile('C:/app/.env')?.id).toBe('env')
    expect(findLanguageForFile('C:/app/.env.local')?.id).toBe('env')
    expect(findLanguageForFile('C:\\app\\.env.production')?.id).toBe('env')
    expect(findLanguageForFile('C:/app/settings.ini')?.id).toBe('env')
  })

  it('finds the text language for text and log files', () => {
    expect(findLanguageForFile('C:/app/notes.txt')?.id).toBe('text')
    expect(findLanguageForFile('C:/app/server.LOG')?.id).toBe('text')
  })

  it('keeps code languages unchanged', () => {
    expect(findLanguageForFile('C:/app/main.ts')?.id).toBe('typescript')
    expect(findLanguageForFile('C:/app/environment.json')?.id).toBe('json')
  })

  it('colors Svelte, Vue and Astro markup, TypeScript scripts and SCSS styles', async () => {
    expect(['App.svelte', 'App.vue', 'Page.astro'].map((name) => findLanguageForFile(`C:/app/${name}`)?.id)).toEqual(['svelte', 'vue', 'astro'])
    const component = '<script lang="ts">let count: number = 0</script>\n<button>{count}</button>\n<style lang="scss">.a { color: red; }</style>'
    const language = findLanguageForFile('C:/app/App.svelte')
    const state = EditorState.create({ doc: component, extensions: language === null ? [] : [await language.load()] })
    const names = new Set<string>()
    ensureSyntaxTree(state, component.length, 5000)?.iterate({ enter: (node) => { names.add(node.name) } })
    expect([...names]).toEqual(expect.arrayContaining(['Element', 'TypeAnnotation', 'ClassName', 'PropertyName']))
  })

  it('returns null for unknown files', () => {
    expect(findLanguageForFile('C:/app/image.png')).toBeNull()
  })
})
