import type { LanguageId } from './languageRegistry'

export interface Snippet {
  prefix: string
  description: string
  body: string
}

const javascriptSnippets: Snippet[] = [
  { prefix: 'clg', description: 'console.log', body: 'console.log(${1})' },
  { prefix: 'fn', description: 'function', body: 'function ${1:name}(${2}) {\n\t${3}\n}' },
  { prefix: 'af', description: 'arrow function', body: 'const ${1:name} = (${2}) => {\n\t${3}\n}' },
  { prefix: 'imp', description: 'import', body: "import { ${2} } from '${1:module}'" },
  { prefix: 'try', description: 'try / catch', body: 'try {\n\t${1}\n} catch (error) {\n\t${2}\n}' },
  { prefix: 'forof', description: 'for...of loop', body: 'for (const ${1:item} of ${2:items}) {\n\t${3}\n}' }
]

const typescriptSnippets: Snippet[] = [
  ...javascriptSnippets,
  { prefix: 'int', description: 'interface', body: 'interface ${1:Name} {\n\t${2}\n}' },
  { prefix: 'type', description: 'type alias', body: 'type ${1:Name} = ${2}' }
]

export const DEFAULT_SNIPPETS: Record<LanguageId, Snippet[]> = {
  javascript: javascriptSnippets,
  typescript: typescriptSnippets,
  json: [],
  css: [{ prefix: 'flex', description: 'flex container', body: 'display: flex;\nalign-items: ${1:center};\ngap: ${2:8px};' }],
  html: [
    {
      prefix: 'html5',
      description: 'HTML page',
      body: '<!doctype html>\n<html lang="en">\n<head>\n\t<meta charset="utf-8" />\n\t<title>${1}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>'
    }
  ],
  markdown: [{ prefix: 'link', description: 'link', body: '[${1:text}](${2:url})' }],
  cpp: [
    { prefix: 'main', description: 'main function', body: '#include <iostream>\n\nint main() {\n\t${1}\n\treturn 0;\n}' },
    { prefix: 'for', description: 'for loop', body: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t${3}\n}' },
    { prefix: 'cout', description: 'std::cout', body: 'std::cout << ${1} << std::endl;' }
  ],
  python: [
    { prefix: 'def', description: 'function', body: 'def ${1:name}(${2}):\n\t${3:pass}' },
    { prefix: 'main', description: 'main guard', body: 'if __name__ == "__main__":\n\t${1:main()}' },
    { prefix: 'cls', description: 'class', body: 'class ${1:Name}:\n\tdef __init__(self${2}):\n\t\t${3:pass}' }
  ],
  rust: [
    { prefix: 'main', description: 'main function', body: 'fn main() {\n\t${1}\n}' },
    { prefix: 'pln', description: 'println!', body: 'println!("${1}");' }
  ],
  go: [
    { prefix: 'main', description: 'main package', body: 'package main\n\nfunc main() {\n\t${1}\n}' },
    { prefix: 'iferr', description: 'if err != nil', body: 'if err != nil {\n\treturn ${1:err}\n}' }
  ],
  java: [
    { prefix: 'main', description: 'main method', body: 'public static void main(String[] args) {\n\t${1}\n}' },
    { prefix: 'sout', description: 'System.out.println', body: 'System.out.println(${1});' }
  ],
  php: [{ prefix: 'fn', description: 'function', body: 'function ${1:name}(${2}) {\n\t${3}\n}' }],
  sql: [{ prefix: 'sel', description: 'select', body: 'SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};' }],
  yaml: []
}
