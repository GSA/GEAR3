import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-button-overlay-panel',
    templateUrl: './button-overlay-panel.component.html',
    styleUrls: ['./button-overlay-panel.component.scss'],
    standalone: false
})
export class ButtonOverlayPanelComponent {

    @Input() buttonText: string = 'help';
    @Input() buttonIcon: string = '';
    @Input() buttonIconPos: string = 'left';

    constructor() {
    }
}
