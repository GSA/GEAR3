import { Component, EventEmitter, ViewChild, ElementRef, Input, OnChanges, Output, Renderer2, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-filter-chips',
    templateUrl: './filter-chips.component.html',
    styleUrls: ['./filter-chips.component.scss'],
    standalone: false
})
export class FilterChipsComponent implements OnChanges {

  @ViewChild('button') button: ElementRef;
  @ViewChild('menu') menu: ElementRef;

  @Input() chips: string[] = [];
  // Currently-applied selection, e.g. restored from the URL. Kept in sync
  // with displayedChips so the pills survive this component being
  // recreated (Angular destroys/recreates it whenever the parent route
  // navigates between /it_standards and /it_standards/filtered/... since
  // those are distinct route configs).
  @Input() selectedChips: string[] = [];
  @Input() dropdownName: string = '';
  @Output() chipSelect: EventEmitter<string[]> = new EventEmitter<string[]>();

  public dropdownOpen: boolean = false;
  public displayedChips: any[] = [];

    constructor(private renderer: Renderer2) {
      // Handle outside clicks to close menu
      this.renderer.listen('window', 'click', (e: Event) => {
        if(this.button && this.menu) {
          if(e.target !== this.button.nativeElement && e.target !== this.menu.nativeElement) {
            this.dropdownOpen = false;
          }
        }
      });
    }

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['selectedChips']) {
        this.displayedChips = [...(this.selectedChips || [])];
      }
    }

    public onDropdownClick(): void {
        this.dropdownOpen = !this.dropdownOpen
    }

    public onChipSelect(item: any): void {
      if(!this.isChipSelected(item)) {
        this.displayedChips.push(item);
        this.dropdownOpen = false;
        this.chipSelect.emit(this.displayedChips);
      }
    }

    public removeChip(index: number): void {
      this.displayedChips.splice(index, 1);
      this.chipSelect.emit(this.displayedChips);
    }

    public removeAllChips(): void {
      this.displayedChips = [];
      this.chipSelect.emit(this.displayedChips);
    }

    public hasDisplayedChips(): boolean {
      return this.displayedChips && this.displayedChips.length > 0;
    }

    public isChipSelected(item: any): boolean {
      let chipIdx = this.displayedChips.findIndex(c => c === item);
      return chipIdx >= 0;
    }
}