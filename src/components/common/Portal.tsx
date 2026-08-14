import { createPortal } from 'react-dom';

/**
 * Renders children directly into `document.body`, escaping any ancestor
 * that would otherwise trap a `position: fixed` overlay inside itself —
 * most commonly an ancestor with a still-"filling" CSS animation/transition
 * on `opacity`/`transform` (e.g. this app's `.animate-fade-in`, which uses
 * `animation-fill-mode: forwards` and so never stops establishing a
 * stacking context). Use for anything that must cover the whole viewport:
 * modals, drawers, dropdowns.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
