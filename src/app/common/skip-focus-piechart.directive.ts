import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[appSkipFocusPiechart]',
})
export class SkipFocusPiechartDirective implements AfterContentChecked {
    private setTabindex = false;
    constructor(private el: ElementRef) { }

    ngAfterContentChecked(): void {
        if (!this.setTabindex) {
            const elements = this.el.nativeElement.querySelectorAll(
                '[ngx-charts-pie-arc=""]'
            );
            if (elements.length > 0) {
                this.setTabindex = true;
            }
            for (const gElement of elements) {
                gElement.setAttribute('tabindex', -1);
            }
        }
    }
}
