// DOM helpers shared by the GEAR UI overlays (tooltip, popover, select, multiselect,
// datepicker). Positioning and stacking follow the same rules the PrimeNG overlays used,
// so popups open in exactly the same places they did before.

interface ZIndexEntry {
  key: string;
  value: number;
}

let zIndexes: ZIndexEntry[] = [];

export const GEAR_Z_INDEX = {
  overlay: 1000,
  tooltip: 1100,
};

export function setZIndex(key: string, el: HTMLElement, base: number): void {
  const last = zIndexes.length > 0 ? zIndexes[zIndexes.length - 1] : { key, value: base };
  const value = last.value + (last.key === key ? 0 : base) + 1;
  zIndexes.push({ key, value });
  el.style.zIndex = String(value);
}

export function clearZIndex(el: HTMLElement | null | undefined): void {
  if (!el) return;
  const value = parseInt(el.style.zIndex, 10) || 0;
  zIndexes = zIndexes.filter((z) => z.value !== value);
  el.style.zIndex = '';
}

export function getViewport(): { width: number; height: number } {
  const e = document.documentElement;
  const g = document.body;
  return {
    width: window.innerWidth || e.clientWidth || g.clientWidth,
    height: window.innerHeight || e.clientHeight || g.clientHeight,
  };
}

export function getWindowScrollTop(): number {
  const doc = document.documentElement;
  return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
}

export function getWindowScrollLeft(): number {
  const doc = document.documentElement;
  return (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
}

function elementDimensions(element: HTMLElement): { width: number; height: number } {
  if (element.offsetParent) {
    return { width: element.offsetWidth, height: element.offsetHeight };
  }
  const visibility = element.style.visibility;
  const display = element.style.display;
  const rect = element.getBoundingClientRect();
  element.style.visibility = 'hidden';
  element.style.display = 'block';
  const dims = { width: rect.width || element.offsetWidth, height: rect.height || element.offsetHeight };
  element.style.display = display;
  element.style.visibility = visibility;
  return dims;
}

// Positions an element appended to <body> below (or above, when there is no room) its target.
export function absolutePosition(element: HTMLElement, target: HTMLElement, gutter = true): void {
  const dims = elementDimensions(element);
  const targetOuterHeight = target.offsetHeight;
  const targetOuterWidth = target.offsetWidth;
  const targetOffset = target.getBoundingClientRect();
  const windowScrollTop = getWindowScrollTop();
  const windowScrollLeft = getWindowScrollLeft();
  const viewport = getViewport();
  let top: number;
  let left: number;
  let origin = 'top';

  if (targetOffset.top + targetOuterHeight + dims.height > viewport.height) {
    top = targetOffset.top + windowScrollTop - dims.height;
    origin = 'bottom';
    if (top < 0) {
      top = windowScrollTop;
    }
  } else {
    top = targetOuterHeight + targetOffset.top + windowScrollTop;
  }

  if (targetOffset.left + dims.width > viewport.width) {
    left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - dims.width);
  } else {
    left = targetOffset.left + windowScrollLeft;
  }

  element.style.insetInlineStart = left + 'px';
  element.style.top = top + 'px';
  element.style.transformOrigin = origin;
  if (gutter) {
    // PrimeNG only applied the 2px anchor gutter when flipping above the target.
    element.style.marginTop = origin === 'bottom' ? 'calc(2px * -1)' : '';
  }
}

// Positions an overlay rendered inside its (position: relative) host directly below the host,
// flipping above it when there is not enough room in the viewport.
export function relativePosition(element: HTMLElement, target: HTMLElement, gutter = true): void {
  const dims = elementDimensions(element);
  const targetHeight = target.offsetHeight;
  const targetOffset = target.getBoundingClientRect();
  const viewport = getViewport();
  let top: number;
  let left: number;
  let origin = 'top';

  if (targetOffset.top + targetHeight + dims.height > viewport.height) {
    top = -1 * dims.height;
    origin = 'bottom';
    if (targetOffset.top + top < 0) {
      top = -1 * targetOffset.top;
    }
  } else {
    top = targetHeight;
  }

  if (dims.width > viewport.width) {
    left = targetOffset.left * -1;
  } else if (targetOffset.left + dims.width > viewport.width) {
    left = (targetOffset.left + dims.width - viewport.width) * -1;
  } else {
    left = 0;
  }

  element.style.top = top + 'px';
  element.style.insetInlineStart = left + 'px';
  element.style.transformOrigin = origin;
  if (gutter) {
    // PrimeNG only applied the 2px anchor gutter when flipping above the target.
    element.style.marginTop = origin === 'bottom' ? 'calc(2px * -1)' : '';
  }
}

export function getScrollableParents(element: Element): Element[] {
  const parents: Element[] = [];
  const overflowRegex = /(auto|scroll)/;
  let node: Node | null = element.parentNode;
  while (node && node.nodeType === 1) {
    try {
      const style = window.getComputedStyle(node as Element);
      if (
        overflowRegex.test(style.getPropertyValue('overflow')) ||
        overflowRegex.test(style.getPropertyValue('overflow-x')) ||
        overflowRegex.test(style.getPropertyValue('overflow-y'))
      ) {
        parents.push(node as Element);
      }
    } catch {
      // Ignore nodes that cannot be inspected.
    }
    node = node.parentNode;
  }
  return parents;
}

export class ScrollParentsListener {
  private parents: Element[] = [];

  constructor(private element: Element, private listener: () => void) {}

  bind(): void {
    this.parents = getScrollableParents(this.element);
    this.parents.forEach((p) => p.addEventListener('scroll', this.listener));
  }

  unbind(): void {
    this.parents.forEach((p) => p.removeEventListener('scroll', this.listener));
    this.parents = [];
  }
}

export function fadeIn(element: HTMLElement, duration: number): void {
  element.style.opacity = '0';
  let last = Date.now();
  const tick = () => {
    const opacity = +element.style.opacity + (Date.now() - last) / duration;
    element.style.opacity = String(opacity);
    last = Date.now();
    if (opacity < 1) {
      requestAnimationFrame(tick);
    }
  };
  tick();
}

// True when a click landed on an interactive element (link, button, input, checkbox) that
// should keep its own behaviour instead of triggering a row click or header sort.
export function isClickable(target: Element | null): boolean {
  if (!target) return false;
  const nodeName = target.nodeName;
  const parentName = target.parentElement && target.parentElement.nodeName;
  return (
    ['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(nodeName) ||
    ['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(parentName || '') ||
    !!target.closest('.gear-button, .gear-checkbox, .gear-radiobutton')
  );
}

export function clearTextSelection(): void {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && selection.toString()) {
    selection.removeAllRanges();
  }
}

export function getFocusableElements(element: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([tabindex="-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),' +
    '[href]:not([tabindex="-1"]):not([style*="display:none"]):not([hidden]),' +
    'input:not([tabindex="-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),' +
    'select:not([tabindex="-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),' +
    'textarea:not([tabindex="-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),' +
    '[tabIndex]:not([tabIndex="-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),' +
    '[contenteditable]:not([tabIndex="-1"]):not([disabled]):not([style*="display:none"]):not([hidden])';
  return Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden',
  );
}

let uidCounter = 0;
export function uniqueId(prefix = 'gear_id_'): string {
  uidCounter++;
  return `${prefix}${uidCounter}`;
}
