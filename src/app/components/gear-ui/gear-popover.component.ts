import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { GEAR_Z_INDEX, absolutePosition, clearZIndex, setZIndex } from './gear-dom';

// Click-to-toggle overlay panel used by the "More Help" buttons. Appended to <body>,
// positioned below its trigger with the pointer arrow, closed on outside click, Escape or
// resize — the same behaviour as the PrimeNG <p-popover> it replaces.
@Component({
  selector: 'gear-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (visible) {
      <div #container role="dialog" aria-modal="true" class="gear-component gear-popover" style="position: absolute" (click)="selfClick = true">
        <div class="gear-popover-content">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
})
export class GearPopoverComponent implements OnDestroy {
  visible = false;
  selfClick = false;

  @ViewChild('container') set containerRef(ref: ElementRef<HTMLElement> | undefined) {
    const el = ref?.nativeElement ?? null;
    if (el && el !== this.container) {
      this.container = el;
      this.onShown();
    }
  }

  private zone = inject(NgZone);
  private container: HTMLElement | null = null;
  private target: HTMLElement | null = null;
  private documentClick: ((e: MouseEvent) => void) | null = null;
  private resize = () => this.zone.run(() => this.hide());
  private keydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.zone.run(() => this.hide());
  };

  toggle(event: Event, target?: HTMLElement): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show(event, target);
    }
  }

  show(event: Event, target?: HTMLElement): void {
    this.target = target || (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    this.visible = true;
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    if (this.container) {
      clearZIndex(this.container);
      this.container.parentElement?.removeChild(this.container);
    }
    this.container = null;
    this.unbind();
  }

  private onShown(): void {
    const container = this.container!;
    document.body.appendChild(container);
    container.classList.add('gear-anchored-overlay-enter-active');
    container.addEventListener('animationend', () => container.classList.remove('gear-anchored-overlay-enter-active'), { once: true });
    if (this.target) {
      absolutePosition(container, this.target, false);
      const containerRect = container.getBoundingClientRect();
      const targetRect = this.target.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(container).borderRadius) || 0;
      const arrowLeft = containerRect.left < targetRect.left ? targetRect.left - containerRect.left - radius * 2 : 0;
      container.style.setProperty('--gear-popover-arrow-left', `${arrowLeft}px`);
      if (containerRect.top < targetRect.top) {
        container.classList.add('gear-popover-flipped');
      }
    }
    setZIndex('overlay', container, GEAR_Z_INDEX.overlay);
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.documentClick = (e: MouseEvent) => {
          const onTarget = !!this.target && this.target.contains(e.target as Node);
          if (!this.selfClick && !onTarget) {
            this.zone.run(() => this.hide());
          }
          this.selfClick = false;
        };
        document.addEventListener('click', this.documentClick);
      });
      window.addEventListener('resize', this.resize);
      document.addEventListener('keydown', this.keydown);
    });
  }

  private unbind(): void {
    if (this.documentClick) document.removeEventListener('click', this.documentClick);
    this.documentClick = null;
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('keydown', this.keydown);
    this.selfClick = false;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
