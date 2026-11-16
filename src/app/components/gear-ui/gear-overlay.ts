import { NgZone } from '@angular/core';
import { GEAR_Z_INDEX, ScrollParentsListener, clearZIndex, relativePosition, setZIndex } from './gear-dom';

// Shared open/close plumbing for dropdown-style overlays rendered inside their host
// (select, multiselect, datepicker). Mirrors the PrimeNG overlay: min-width of the target,
// flip above when there is no room below, close on outside click / Escape / resize /
// scroll of any scrollable ancestor, and the same "anchored overlay" enter animation.
export class GearConnectedOverlay {
  private documentClick: ((e: MouseEvent) => void) | null = null;
  private resize: (() => void) | null = null;
  private keydown: ((e: KeyboardEvent) => void) | null = null;
  private scroll: ScrollParentsListener | null = null;
  private overlayClicked = false;

  constructor(
    private zone: NgZone,
    private getTarget: () => HTMLElement | null,
    private getWrapper: () => HTMLElement | null,
    private onHide: () => void,
  ) {}

  markOverlayClick(): void {
    this.overlayClicked = true;
  }

  opened(): void {
    const wrapper = this.getWrapper();
    const target = this.getTarget();
    if (!wrapper || !target) return;
    wrapper.style.minWidth = target.offsetWidth + 'px';
    relativePosition(wrapper, target);
    setZIndex('overlay', wrapper, GEAR_Z_INDEX.overlay);
    const panel = wrapper.firstElementChild as HTMLElement | null;
    if (panel) {
      panel.classList.add('gear-anchored-overlay-enter-active');
      panel.addEventListener('animationend', () => panel.classList.remove('gear-anchored-overlay-enter-active'), { once: true });
    }
    this.zone.runOutsideAngular(() => {
      // Bind after the opening click has finished propagating.
      setTimeout(() => {
        this.documentClick = (e: MouseEvent) => {
          const t = this.getTarget();
          const isTargetClicked = !!t && (t.isSameNode(e.target as Node) || (!this.overlayClicked && t.contains(e.target as Node)));
          const outside = !isTargetClicked && !this.overlayClicked;
          if (outside && e.which !== 3) {
            this.zone.run(() => this.onHide());
          }
          this.overlayClicked = false;
        };
        document.addEventListener('click', this.documentClick);
      });
      this.resize = () => this.zone.run(() => this.onHide());
      window.addEventListener('resize', this.resize);
      // Escape closes the overlay even when focus has left the trigger (e.g. after a mouse pick).
      this.keydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.zone.run(() => this.onHide());
      };
      document.addEventListener('keydown', this.keydown);
      this.scroll = new ScrollParentsListener(target, () => this.zone.run(() => this.onHide()));
      this.scroll.bind();
    });
  }

  closed(): void {
    clearZIndex(this.getWrapper());
    if (this.documentClick) document.removeEventListener('click', this.documentClick);
    if (this.resize) window.removeEventListener('resize', this.resize);
    if (this.keydown) document.removeEventListener('keydown', this.keydown);
    this.keydown = null;
    this.scroll?.unbind();
    this.documentClick = null;
    this.resize = null;
    this.scroll = null;
    this.overlayClicked = false;
  }
}
