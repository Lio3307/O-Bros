import { isAllowedAttribute, verdictForTag } from './htmlRules'

function cleanChildren(parent: Node, target: Node, document: Document): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.textContent ?? ''))
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue
    }
    const element = child as Element
    const verdict = verdictForTag(element.tagName)
    if (verdict === 'drop') {
      continue
    }
    if (verdict === 'unwrap') {
      cleanChildren(element, target, document)
      continue
    }
    const copy = document.createElement(element.tagName.toLowerCase())
    for (const attribute of Array.from(element.attributes)) {
      if (isAllowedAttribute(element.tagName, attribute.name, attribute.value)) {
        copy.setAttribute(attribute.name, attribute.value)
      }
    }
    if (copy.tagName === 'A') {
      copy.setAttribute('target', '_blank')
      copy.setAttribute('rel', 'noopener noreferrer')
    }
    cleanChildren(element, copy, document)
    target.appendChild(copy)
  }
}

export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const output = document.createElement('div')
  cleanChildren(parsed.body, output, document)
  return output.innerHTML
}
