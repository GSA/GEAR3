import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { Globals } from '@common/globals';

@Injectable({
  providedIn: 'root',
})
export class ModalsService {
  // Investment
  private investSource = new Subject();
  currentInvest = this.investSource.asObservable();

  // Capability
  private capSource = new Subject();
  currentCap = this.capSource.asObservable();

  // Organization
  private orgSource = new Subject();
  currentOrg = this.orgSource.asObservable();

  // Website Service Category
  private websiteServiceCategorySource = new Subject();
  currentWebsiteServiceCategory =
    this.websiteServiceCategorySource.asObservable();

  // System
  private sysSource = new Subject();
  currentSys = this.sysSource.asObservable();

  // Data Flow
  private dataFlowSource = new Subject();
  currentDataFlow = this.dataFlowSource.asObservable();

  // Records Management
  private recordSource = new Subject();
  currentRecord = this.recordSource.asObservable();

  // FiSMA System
  private fismaSysSource = new Subject();
  currentFismaSys = this.fismaSysSource.asObservable();

  // IT Standards
  private itStandSource = new Subject();
  currentITStand = this.itStandSource.asObservable();

  // New Record Creation
  private createRecordSource = new Subject();
  currentCreate = this.createRecordSource.asObservable();

  // Websites
  private websiteSource = new Subject();
  currentWebsite = this.websiteSource.asObservable();

  constructor(private globals: Globals, private router: Router) {}

  public updateDetails(row: {}, component: string, addRoute: boolean) {
    if (component == 'investment') {
      this.investSource.next(row);
    } else if (component == 'capability') {
      this.capSource.next(row);
    } else if (component == 'websiteServiceCategory') {
      this.websiteServiceCategorySource.next(row);
    } else if (component == 'organization') {
      this.orgSource.next(row);
    } else if (component == 'system') {
      this.sysSource.next(row);
    } else if (component == 'data-flow') {
      this.dataFlowSource.next(row);
    } else if (component == 'record') {
      this.recordSource.next(row);
    } else if (component == 'fisma') {
      this.fismaSysSource.next(row);
    } else if (component == 'it-standard') {
      this.itStandSource.next(row);
    } else if (component == 'website') {
      this.websiteSource.next(row);
    } else {
      console.log('Error: Not a valid component to update details');
    }

    // Add data to history of modals for routing purposes
    if (addRoute) {
      this.globals.modalRoutes.push({
        component: component,
        data: row,
      });
      // console.log(this.globals.modalRoutes);  // Debug
    } else {
      // Reset Modal Routes since navigating to a new modal that we don't care about the previous ones of
      this.globals.modalRoutes = [];
    }
  }

  // For setting creation flag
  public updateRecordCreation(bool: boolean) {
    this.createRecordSource.next(bool);
  }

  onScrollToEnd(
    buffer: any,
    bufferSize: number = 50,
    fullList: [],
    loading: boolean
  ) {
    this.fetchMore(buffer, bufferSize, fullList, loading);
  }

  onScroll(
    { end },
    buffer: any,
    bufferSize: number = 50,
    fullList: [],
    loading: boolean
  ) {
    let numberOfItemsFromEndBeforeFetchingMore = 10;
    if (loading || fullList.length <= buffer.length) {
      return;
    }

    if (end + numberOfItemsFromEndBeforeFetchingMore >= buffer.length) {
      this.fetchMore(buffer, bufferSize, fullList, loading);
    }
  }

  private fetchMore(
    buffer: any,
    bufferSize: number = 50,
    fullList: [],
    loading: boolean
  ) {
    const len = buffer.length;
    const more = fullList.slice(len, bufferSize + len);
    loading = true;
    // using timeout here to simulate backend API delay
    setTimeout(() => {
      loading = false;
      buffer = buffer.concat(more);
    }, 100);
  }

  public fieldValidCheck(form: FormGroup, field: string) {
    return form.controls[field].invalid;
  }

  public checkModalRoutes() {
    return this.globals.modalRoutes.length > 1; // Greater than one because the initial click is from the main table, not a modal table.
  }
}
