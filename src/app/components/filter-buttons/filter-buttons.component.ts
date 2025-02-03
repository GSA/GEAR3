import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FilterButton, TwoDimArray } from '@common/table-classes';

@Component({
  selector: 'app-filter-buttons',
  templateUrl: './filter-buttons.component.html',
  styleUrls: ['./filter-buttons.component.scss']
})

export class FilterButtonsComponent implements OnChanges {

    // Two dimenstional array of button filters
  // Each array of strings is a grouping of buttons
  @Input() filterButtons: TwoDimArray<FilterButton> = [];
  @Input() preloadedFilterButtons: FilterButton[] = [];
  @Input() singleFilterOnly: boolean = false;

  @Output() filterClick = new EventEmitter<FilterButton[]>();
  @Output() filterResetClick = new EventEmitter<any>();

  public currentFilterButtons: FilterButton[] = [];

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes.preloadedFilterButtons) {
      if(this.preloadedFilterButtons && this.preloadedFilterButtons.length > 0) {
        for(let p = 0; p < this.preloadedFilterButtons.length; p++) {
          this.currentFilterButtons.push(this.preloadedFilterButtons[p]);
          this.handleFilterButtonEmit();
        }
      } else {
        this.currentFilterButtons = [];
        this.handleFilterButtonEmit();
      }
    }
  }

  public onFilterButtonClick(filter: FilterButton): void {
    if(!this.singleFilterOnly) {
      let fbToRemove = this.getSameFieldFilterButton(filter);
      if(fbToRemove) {
        let index = -1;
        index = this.currentFilterButtons.findIndex(f => f === fbToRemove);
        this.currentFilterButtons.splice(index, 1);
        this.currentFilterButtons.push(filter);
  
        this.handleFilterButtonEmit();
        return;
      }
  
      if(this.isFilterButtonActive(filter)) {
        let index = -1;
        index = this.currentFilterButtons.findIndex(f => f === filter);
        this.currentFilterButtons.splice(index, 1);
      } else {
        this.currentFilterButtons.push(filter);
      }
    } else {
      this.currentFilterButtons = [];
      this.currentFilterButtons.push(filter);
    }

    this.handleFilterButtonEmit();
  }

  public onFilterButtonClear(): void {
    this.currentFilterButtons = [];
    this.filterResetClick.emit();
  }

  public isFilterButtonActive(filter: FilterButton): boolean {
    if(this.currentFilterButtons && this.currentFilterButtons.length > 0) {
      for (let i = 0; i < this.currentFilterButtons.length; i++) {
        if(this.currentFilterButtons[i] === filter || this.currentFilterButtons[i].buttonText === filter.buttonText) {
          return true;
        }
      }
    }
    return false;
  }

  public showResetButton(): boolean {
    return this.currentFilterButtons && this.currentFilterButtons.length > 0;
  }

  private getSameFieldFilterButton(filter: FilterButton): FilterButton | null {
    for(let fb = 0; fb < this.currentFilterButtons.length; fb++) {
      for(let f = 0; f < this.currentFilterButtons[fb].filters.length; f++) {
        for(let x = 0; x < filter.filters.length; x++) {
          if((this.currentFilterButtons[fb].filters[f].field === filter.filters[x].field)
             && this.currentFilterButtons[fb].buttonText !== filter.buttonText) {
            return this.currentFilterButtons[fb];
          }
        }
      }
    }
    return null;
  }

  private handleFilterButtonEmit(): void {
    if(this.currentFilterButtons && this.currentFilterButtons.length > 0) {
      this.filterClick.emit(this.currentFilterButtons);
    } else {
      this.filterResetClick.emit();
    }
  }
}
