/** True while the user is typing in a field, so global shortcuts stay out of the way. */
export function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/** True when the key event comes from a modified chord (Ctrl/⌘/Alt) that belongs to the browser or OS. */
export function hasModifier(e: KeyboardEvent): boolean {
  return e.altKey || e.ctrlKey || e.metaKey;
}
