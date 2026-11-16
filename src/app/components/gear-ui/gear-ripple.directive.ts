import { Directive, ElementRef, HostListener, NgZone, OnDestroy, Renderer2, inject } from '@angular/core';

// Click "ink" effect that matches the ripple GEAR's buttons, paginator links and list
// options had under PrimeNG (ripple was enabled globally).
@Directive({
  selector: '[gearRipple]',
  standalone: true,
  host: { class: 'gear-ripple' },
})
export class GearRippleDirective implements OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);
  private zone = inject(NgZone);
  private ink: HTMLElement | null = null;
  private timeout: any;

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    const host = this.el.nativeElement;
    if (host.classList.contains('gear-disabled') || (host as HTMLButtonElement).disabled) {
      return;
    }
    this.zone.runOutsideAngular(() => {
      const ink = this.getInk();
      ink.classList.remove('gear-ink-active');
      if (!ink.offsetHeight && !ink.offsetWidth) {
        const d = Math.max(host.offsetWidth, host.offsetHeight);
        ink.style.height = d + 'px';
        ink.style.width = d + 'px';
      }
      const rect = host.getBoundingClientRect();
      const x = event.pageX - (rect.left + window.scrollX) + document.body.scrollTop - ink.offsetWidth / 2;
      const y = event.pageY - (rect.top + window.scrollY) + document.body.scrollLeft - ink.offsetHeight / 2;
      ink.style.top = y + 'px';
      ink.style.left = x + 'px';
      ink.classList.add('gear-ink-active');
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => ink.classList.remove('gear-ink-active'), 401);
    });
  }

  private getInk(): HTMLElement {
    if (!this.ink) {
      this.ink = this.renderer.createElement('span');
      this.ink!.className = 'gear-ink';
      this.ink!.setAttribute('aria-hidden', 'true');
      this.ink!.setAttribute('role', 'presentation');
      this.renderer.appendChild(this.el.nativeElement, this.ink);
    }
    return this.ink!;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeout);
    if (this.ink && this.ink.parentElement) {
      this.ink.parentElement.removeChild(this.ink);
    }
  }
}
