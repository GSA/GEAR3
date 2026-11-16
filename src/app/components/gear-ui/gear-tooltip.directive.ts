import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, AfterViewInit, SimpleChanges, inject } from '@angular/core';
import { ScrollParentsListener, clearZIndex, fadeIn, getViewport, getWindowScrollLeft, getWindowScrollTop, setZIndex, GEAR_Z_INDEX } from './gear-dom';

type TooltipPosition = 'right' | 'left' | 'top' | 'bottom';

// Hover tooltip used for column-header definitions, detail-page field help and the report
// toolbar buttons. Behaviour (positions, flipping, escape-to-close, auto hide, HTML content)
// matches the PrimeNG pTooltip it replaces.
@Directive({
  selector: '[gearTooltip]',
  standalone: true,
})
export class GearTooltipDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input('gearTooltip') content: string | null | undefined = '';
  @Input() tooltipPosition: TooltipPosition = 'right';
  @Input() tooltipStyleClass = '';
  // When false the tooltip text is treated as trusted HTML (GEAR's data-dictionary tooltips).
  @Input() escape = true;
  @Input() tooltipDisabled = false;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private container: HTMLElement | null = null;
  private textEl: HTMLElement | null = null;
  private scrollListener: ScrollParentsListener | null = null;
  private resizeListener = () => this.hide();
  private escapeListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.hide();
  };
  private listeners: Array<[string, EventListener]> = [];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const host = this.el.nativeElement;
      const add = (name: string, fn: EventListener) => {
        host.addEventListener(name, fn, name.startsWith('touch') ? { passive: true } : undefined);
        this.listeners.push([name, fn]);
      };
      add('mouseenter', () => this.show());
      add('mouseleave', () => this.hide());
      add('click', () => this.hide());
      add('touchstart', () => this.show());
      add('touchend', () => setTimeout(() => this.hide(), 1500));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.container && (changes['content'] || changes['escape'])) {
      if (!this.content) {
        this.hide();
      } else {
        this.updateText();
        this.align();
      }
    }
  }

  private show(): void {
    if (!this.content || this.tooltipDisabled) {
      return;
    }
    this.create();
    this.container!.style.display = 'inline-block';
    this.align();
    fadeIn(this.container!, 250);
    setZIndex('tooltip', this.container!, GEAR_Z_INDEX.tooltip);
    window.addEventListener('resize', this.resizeListener);
    document.addEventListener('keydown', this.escapeListener);
    this.scrollListener = new ScrollParentsListener(this.el.nativeElement, () => this.hide());
    this.scrollListener.bind();
  }

  private create(): void {
    this.remove();
    const container = document.createElement('div');
    container.className = 'gear-tooltip gear-component';
    container.setAttribute('role', 'tooltip');
    const arrow = document.createElement('div');
    arrow.className = 'gear-tooltip-arrow';
    container.appendChild(arrow);
    this.textEl = document.createElement('div');
    this.textEl.className = 'gear-tooltip-text';
    container.appendChild(this.textEl);
    container.style.display = 'none';
    container.style.width = 'fit-content';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    this.container = container;
    this.updateText();
  }

  private updateText(): void {
    if (!this.textEl) return;
    if (this.escape) {
      this.textEl.textContent = this.content ?? '';
    } else {
      this.textEl.innerHTML = this.content ?? '';
    }
  }

  private align(): void {
    const order: Record<TooltipPosition, TooltipPosition[]> = {
      top: ['top', 'bottom', 'right', 'left'],
      bottom: ['bottom', 'top', 'right', 'left'],
      left: ['left', 'right', 'top', 'bottom'],
      right: ['right', 'left', 'top', 'bottom'],
    };
    const positions = order[this.tooltipPosition] || order.right;
    for (let i = 0; i < positions.length; i++) {
      if (i === 0 || this.isOutOfBounds()) {
        this.alignTo(positions[i]);
      } else {
        break;
      }
    }
  }

  private hostOffset(): { left: number; top: number } {
    const rect = this.el.nativeElement.getBoundingClientRect();
    return { left: rect.left + getWindowScrollLeft(), top: rect.top + getWindowScrollTop() };
  }

  private alignTo(position: TooltipPosition): void {
    const container = this.container!;
    const host = this.el.nativeElement;
    container.style.left = '-999px';
    container.style.top = '-999px';
    container.className = `gear-tooltip gear-component gear-tooltip-${position}${this.tooltipStyleClass ? ' ' + this.tooltipStyleClass : ''}`;
    const arrow = container.querySelector<HTMLElement>('.gear-tooltip-arrow')!;
    const hostWidth = host.offsetWidth;
    const hostHeight = host.offsetHeight;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    let offsetLeft = 0;
    let offsetTop = 0;
    arrow.style.top = '';
    arrow.style.right = '';
    arrow.style.bottom = '';
    arrow.style.left = '';

    if (position === 'right') {
      offsetLeft = hostWidth;
      offsetTop = (hostHeight - height) / 2;
      arrow.style.top = '50%';
      arrow.style.left = '0';
    } else if (position === 'left') {
      offsetLeft = -width;
      offsetTop = (hostHeight - height) / 2;
      arrow.style.top = '50%';
      arrow.style.right = '0';
    } else if (position === 'top') {
      offsetLeft = (hostWidth - width) / 2;
      offsetTop = -height;
      arrow.style.bottom = '0';
      arrow.style.left = width / 2 + 'px';
    } else {
      offsetLeft = (hostWidth - width) / 2;
      offsetTop = hostHeight;
      arrow.style.top = '0';
      arrow.style.left = width / 2 + 'px';
    }

    const offset = this.hostOffset();
    container.style.left = offset.left + offsetLeft + 'px';
    container.style.top = offset.top + offsetTop + 'px';
  }

  private isOutOfBounds(): boolean {
    const rect = this.container!.getBoundingClientRect();
    const viewport = getViewport();
    const width = this.container!.offsetWidth;
    const height = this.container!.offsetHeight;
    return rect.left + width > viewport.width || rect.left < 0 || rect.top < 0 || rect.top + height > viewport.height;
  }

  private hide(): void {
    if (!this.container) return;
    clearZIndex(this.container);
    this.remove();
  }

  private remove(): void {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.container = null;
    this.textEl = null;
    window.removeEventListener('resize', this.resizeListener);
    document.removeEventListener('keydown', this.escapeListener);
    this.scrollListener?.unbind();
    this.scrollListener = null;
  }

  ngOnDestroy(): void {
    const host = this.el.nativeElement;
    this.listeners.forEach(([name, fn]) => host.removeEventListener(name, fn));
    this.hide();
  }
}
