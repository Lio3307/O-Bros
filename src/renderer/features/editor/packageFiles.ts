import type { LanguageId } from './languageRegistry'

export interface PackageFileKind {
  builtIn?: LanguageId
  catalogName?: string
}

const JSON_FILE: PackageFileKind = { builtIn: 'json' }
const YAML_FILE: PackageFileKind = { builtIn: 'yaml' }
const TOML_FILE: PackageFileKind = { catalogName: 'TOML' }
const CONFIG_FILE: PackageFileKind = { builtIn: 'env' }
const TEXT_FILE: PackageFileKind = { builtIn: 'text' }

const PACKAGE_FILES: Record<string, PackageFileKind> = {
  'bun.lock': JSON_FILE,
  'deno.lock': JSON_FILE,
  'flake.lock': JSON_FILE,
  'composer.lock': JSON_FILE,
  'pipfile.lock': JSON_FILE,
  'package.resolved': JSON_FILE,
  '.babelrc': JSON_FILE,
  '.eslintrc': JSON_FILE,
  '.prettierrc': JSON_FILE,
  '.swcrc': JSON_FILE,
  'yarn.lock': YAML_FILE,
  'pubspec.lock': YAML_FILE,
  'cargo.lock': TOML_FILE,
  'poetry.lock': TOML_FILE,
  'uv.lock': TOML_FILE,
  'pdm.lock': TOML_FILE,
  'pipfile': TOML_FILE,
  '.npmrc': CONFIG_FILE,
  '.yarnrc': CONFIG_FILE,
  '.editorconfig': CONFIG_FILE,
  '.gitconfig': CONFIG_FILE,
  'go.sum': TEXT_FILE,
  'gemfile.lock': TEXT_FILE,
  'podfile.lock': YAML_FILE
}

export function packageFileKindOf(fileName: string): PackageFileKind | null {
  return PACKAGE_FILES[fileName.toLowerCase()] ?? null
}
