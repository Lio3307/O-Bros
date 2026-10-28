import type { CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete'

const STANDARD_GLOBALS = {
  console,
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  BigInt,
  Symbol,
  Date,
  RegExp,
  Error,
  Promise,
  Reflect,
  Proxy,
  Intl,
  Map,
  Set,
  WeakMap,
  WeakSet,
  URL,
  URLSearchParams,
  Headers,
  Request,
  Response,
  AbortController,
  TextEncoder,
  TextDecoder,
  structuredClone,
  fetch,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  crypto,
  performance,
  document,
  navigator,
  localStorage,
  sessionStorage
}

type JavascriptModule = typeof import('@codemirror/lang-javascript')

let javascriptModule: Promise<JavascriptModule> | null = null
let globalsSource: CompletionSource | null = null

function loadJavascript(): Promise<JavascriptModule> {
  javascriptModule ??= import('@codemirror/lang-javascript')
  return javascriptModule
}

function isInJavascript(module: JavascriptModule, context: CompletionContext): boolean {
  const languages = [module.javascriptLanguage, module.typescriptLanguage, module.jsxLanguage, module.tsxLanguage]
  return languages.some((language) => language.isActiveAt(context.state, context.pos, -1))
}

export async function completeJavascriptGlobals(context: CompletionContext): Promise<CompletionResult | null> {
  const module = await loadJavascript()
  if (!isInJavascript(module, context)) {
    return null
  }
  globalsSource ??= module.scopeCompletionSource(STANDARD_GLOBALS)
  return globalsSource(context)
}
