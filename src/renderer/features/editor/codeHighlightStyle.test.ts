import { languages } from '@codemirror/language-data'
import { getStyleTags } from '@lezer/highlight'
import { describe, expect, it } from 'vitest'
import { COLOR_THEMES } from '../../theme/colorThemes'
import { codeHighlightStyle } from './codeHighlightStyle'

const SAMPLE = [
  '#!/usr/bin/env bash',
  '# comment',
  '// another comment',
  '/* block */',
  '[section]',
  'key = "value"',
  'name: value',
  'export const MAX = 42',
  'import os',
  '@decorator',
  'function greet(name, $item) { return `Hi ${name}\n` + true + null }',
  'class Person extends Base { self.age = 3.5e2; this.ok = false }',
  '<div class="box" id=\'x\'>Hello &amp; bye</div>',
  '- item one',
  '> quote **bold** _em_ `code` [link](https://example.com)',
  '+added line',
  '-removed line',
  'SELECT * FROM users WHERE id = 1;',
  'if x == 1 then print(x) end',
  'let v: Vec<i32> = vec![1, 2]; // done',
  'label: goto label',
  '#define MACRO(x) (x * 2)',
  '%{ escape %} \t \u00e9 0xFF 10px #ff00aa'
].join('\n')

function unstyledTagsOf(languageNames: string[]): Promise<Map<string, Set<string>>> {
  const style = codeHighlightStyle(COLOR_THEMES[0])
  const unstyled = new Map<string, Set<string>>()
  return Promise.all(
    languages
      .filter((description) => languageNames.length === 0 || languageNames.includes(description.name))
      .map(async (description) => {
        const support = await description.load()
        let tree
        try {
          tree = support.language.parser.parse(SAMPLE)
        } catch {
          return
        }
        tree.iterate({
          enter: (node) => {
            const rule = getStyleTags(node)
            if (rule !== null && rule.tags.length > 0 && style.style(rule.tags) === null) {
              const name = rule.tags.map(String).join(' ')
              unstyled.set(name, (unstyled.get(name) ?? new Set()).add(description.name))
            }
          }
        })
      })
  ).then(() => unstyled)
}

describe('codeHighlightStyle', () => {
  it('gives a color to every kind of token in every language of the catalog', async () => {
    const unstyled = await unstyledTagsOf([])
    const report = [...unstyled].map(([tag, names]) => `${tag} (${[...names].slice(0, 4).join(', ')}${names.size > 4 ? ` +${names.size - 4}` : ''})`)
    expect(report).toEqual([])
  }, 60_000)
})
