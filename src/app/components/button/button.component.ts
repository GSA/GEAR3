import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    standalone: false
})
export class ButtonComponent {

    @Input() buttonText: string = '';
    @Input() buttonIcon: string = '';
    @Input() buttonType: 'button' | 'dropdown' = 'button';
    @Input() buttonStyle: 'primary' | 'outline' | 'link' | 'success' | 'error' = 'primary';
    @Input() disabled: boolean = false;

    @Output() buttonClick: EventEmitter<any> = new EventEmitter();

    public isDropdownOpen: boolean = false;

    @HostListener('document:click', ['$event']) onDocumentClick() {
        this.isDropdownOpen = false;
      }
  
    constructor() {
    }

    public isButtonDropdown(): boolean {
        return this.buttonType && this.buttonType === 'dropdown';
    }

    public onButtonClick(e: Event): void {
        e.stopPropagation();
        if(this.isButtonDropdown()) {
            this.isDropdownOpen = !this.isDropdownOpen;
        } else {
            this.buttonClick.emit();
        }
    }
}