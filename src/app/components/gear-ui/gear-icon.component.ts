import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GEAR_ICONS, GearIconPath } from './gear-icons';

@Component({
  selector: 'svg[gearIcon]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    width: '14',
    height: '14',
    viewBox: '0 0 14 14',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
    '[attr.data-icon]': 'gearIcon',
  },
  template: `
    @for (p of paths; track $index) {
      <svg:path [attr.d]="p.d" [attr.fill-rule]="p.evenodd ? 'evenodd' : null" [attr.clip-rule]="p.evenodd ? 'evenodd' : null" fill="currentColor" />
    }
  `,
})
export class GearIconComponent {
  @Input() gearIcon = '';

  get paths(): GearIconPath[] {
    return GEAR_ICONS[this.gearIcon] || [];
  }
}
