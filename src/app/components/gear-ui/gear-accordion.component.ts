import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  inject,
  forwardRef,
} from '@angular/core';
import { GearIconComponent } from './gear-icon.component';
import { GearRippleDirective } from './gear-ripple.directive';
import { uniqueId } from './gear-dom';

// Collapsible panels for the Service Categories list on the website details page. Uses the
// same panel/header/content structure, single-open behaviour, keyboard support and collapse
// animation as the PrimeNG <p-accordion> it replaces.
@Component({
  selector: 'gear-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'gear-accordion gear-component', '(keydown)': 'onKeydown($event)' },
  template: `<ng-content></ng-content>`,
})
export class GearAccordionComponent {
  @Input() multiple = false;
  @Input() value: any = undefined;
  @Output() valueChange = new EventEmitter<any>();

  @ContentChildren(forwardRef(() => GearAccordionPanelComponent)) panels!: QueryList<GearAccordionPanelComponent>;

  readonly id = uniqueId('gear_accordion_');
  el = inject<ElementRef<HTMLElement>>(ElementRef);

  isActive(panelValue: any): boolean {
    return this.multiple ? Array.isArray(this.value) && this.value.includes(panelValue) : this.value === panelValue;
  }

  toggle(panelValue: any): void {
    if (this.multiple) {
      const next = Array.isArray(this.value) ? [...this.value] : [];
      const i = next.indexOf(panelValue);
      i === -1 ? next.push(panelValue) : next.splice(i, 1);
      this.value = next;
    } else {
      this.value = this.value === panelValue ? undefined : panelValue;
    }
    this.valueChange.emit(this.value);
  }

  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('gear-accordionheader')) return;
    const headers = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(':scope > gear-accordion-panel > .gear-accordionheader'));
    const index = headers.indexOf(target);
    let next: HTMLElement | undefined;
    switch (event.code) {
      case 'ArrowDown':
        next = headers[index + 1] ?? headers[0];
        break;
      case 'ArrowUp':
        next = headers[index - 1] ?? headers[headers.length - 1];
        break;
      case 'Home':
        next = headers[0];
        break;
      case 'End':
        next = headers[headers.length - 1];
        break;
      default:
        return;
    }
    next?.focus();
    event.preventDefault();
  }
}

@Component({
  selector: 'gear-accordion-panel',
  standalone: true,
  imports: [GearIconComponent, GearRippleDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    class: 'gear-accordionpanel',
    '[class.gear-accordionpanel-active]': 'active',
  },
  template: `
    <div
      gearRipple
      class="gear-accordionheader"
      role="button"
      tabindex="0"
      style="user-select: none"
      [attr.id]="headerId"
      [attr.aria-expanded]="active"
      [attr.aria-controls]="contentId"
      aria-disabled="false"
      (click)="accordion.toggle(value)"
      (keydown.enter)="accordion.toggle(value); $event.preventDefault()"
      (keydown.space)="accordion.toggle(value); $event.preventDefault()"
      (keydown.numpadenter)="accordion.toggle(value); $event.preventDefault()"
    >
      <ng-content select="[gearAccordionHeader]"></ng-content>
      @if (active) {
        <svg gearIcon="chevron-up" class="gear-accordionheader-toggle-icon"></svg>
      } @else {
        <svg gearIcon="chevron-down"></svg>
      }
    </div>
    <div class="gear-accordioncontent" role="region" [attr.id]="contentId" [attr.aria-labelledby]="headerId">
      <div #motion class="gear-motion" [style.visibility]="shown ? null : 'hidden'" [style.max-height]="shown ? null : '0'" [style.overflow]="shown ? null : 'hidden'">
        <div class="gear-accordioncontent-wrapper">
          <div class="gear-accordioncontent-content">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GearAccordionPanelComponent {
  @Input() value: any;

  @ViewChild('motion') motion?: ElementRef<HTMLElement>;

  accordion = inject(GearAccordionComponent);
  private uid = uniqueId('gear_accordion_panel_');
  private wasActive = false;
  // Stays true while the collapse animation runs so the content is visible until it finishes.
  shown = false;

  get active(): boolean {
    const active = this.accordion.isActive(this.value);
    if (active !== this.wasActive) {
      this.wasActive = active;
      this.animate(active);
    }
    return active;
  }

  private animate(opening: boolean): void {
    const el = this.motion?.nativeElement;
    if (opening) {
      this.shown = true;
    }
    if (!el) {
      this.shown = opening;
      return;
    }
    const cls = opening ? 'gear-collapsible-enter-active' : 'gear-collapsible-leave-active';
    el.classList.remove('gear-collapsible-enter-active', 'gear-collapsible-leave-active');
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener(
      'animationend',
      () => {
        el.classList.remove(cls);
        if (!opening && !this.accordion.isActive(this.value)) {
          this.shown = false;
        }
      },
      { once: true },
    );
  }

  get headerId(): string {
    return `${this.uid}_header`;
  }

  get contentId(): string {
    return `${this.uid}_content`;
  }
}
