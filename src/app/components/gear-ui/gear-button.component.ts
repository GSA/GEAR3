import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { GearRippleDirective } from './gear-ripple.directive';

export type GearButtonSeverity = 'primary' | 'secondary' | 'contrast' | null;

// Drop-in replacement for the PrimeNG <p-button> markup GEAR used: renders a single <button>
// with the same class structure so existing GEAR button styles keep applying.
@Component({
  selector: 'gear-button',
  standalone: true,
  imports: [NgClass, GearRippleDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button
      gearRipple
      [attr.type]="type"
      [attr.aria-label]="ariaLabel"
      [disabled]="disabled"
      [ngClass]="buttonClasses"
      (click)="onClick.emit($event)"
    >
      <ng-content></ng-content>
      @if (icon) {
        <span [ngClass]="iconClasses"></span>
      }
      @if (label) {
        <span class="gear-button-label" [attr.aria-hidden]="icon && !label">{{ label }}</span>
      }
    </button>
  `,
})
export class GearButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPos: 'left' | 'right' | string = 'left';
  @Input() severity: GearButtonSeverity = null;
  @Input() variant: 'text' | 'outlined' | null = null;
  @Input() size: 'small' | 'large' | null = null;
  @Input() ariaLabel: string | null = null;
  @Input() type = 'button';
  @Input() disabled = false;
  @Input() styleClass = '';
  // Marks a button whose only content is a projected icon (e.g. an <svg>), matching PrimeNG's
  // icon-only sizing when the icon came from a template rather than the "icon" input.
  @Input() iconOnly = false;

  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): Record<string, boolean> {
    return {
      'gear-button': true,
      'gear-component': true,
      'gear-button-icon-only': (!!this.icon || this.iconOnly) && !this.label,
      [`gear-button-${this.severity}`]: !!this.severity,
      'gear-button-text': this.variant === 'text',
      'gear-button-outlined': this.variant === 'outlined',
      'gear-button-sm': this.size === 'small',
      'gear-button-lg': this.size === 'large',
      [this.styleClass]: !!this.styleClass,
    };
  }

  get iconClasses(): Record<string, boolean> {
    return {
      'gear-button-icon': true,
      [`gear-button-icon-${this.iconPos}`]: !!this.label,
      'gear-button-icon-left': this.iconPos === 'left' && !!this.label,
      'gear-button-icon-right': this.iconPos === 'right' && !!this.label,
      [this.icon]: true,
    };
  }
}
