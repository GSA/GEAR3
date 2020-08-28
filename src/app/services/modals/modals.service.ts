import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
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

  // Parent System
  private sysSource = new Subject();
  currentSys = this.sysSource.asObservable();

  // Application
  private appSource = new Subject();
  currentApp = this.appSource.asObservable();

  // Data Flow
  private dataFlowSource = new Subject();
  currentDataFlow = this.dataFlowSource.asObservable();

  // FiSMA System
  private fismaSysSource = new Subject();
  currentFismaSys = this.fismaSysSource.asObservable();

  // IT Standards
  private itStandSource = new Subject();
  currentITStand = this.itStandSource.asObservable();

  // New Record Creation
  private createRecordSource = new Subject();
  currentCreate = this.createRecordSource.asObservable();

  constructor() { }

  public updateDetails(row: {}, component: string) {
    if (component == 'investment') {
      this.investSource.next(row);
    } else if (component == 'capability') {
      this.capSource.next(row);
    } else if (component == 'organization') {
      this.orgSource.next(row);
    } else if (component == 'system') {
      this.sysSource.next(row);
    } else if (component == 'application') {
      this.appSource.next(row);
    } else if (component == 'data-flow') {
      this.dataFlowSource.next(row);
    } else if (component == 'fisma') {
      this.fismaSysSource.next(row);
    } else if (component == 'it-standard') {
      this.itStandSource.next(row);
    } else {
      console.log("Error: Not a valid component to update details");
    }
  }

  // For setting creation flag
  public updateRecordCreation(bool: boolean) {
    this.createRecordSource.next(bool);
  }

  onScrollToEnd(buffer: any, bufferSize: number = 50, fullList: [], loading: boolean) {
    this.fetchMore(buffer, bufferSize, fullList, loading);
  };

  onScroll({ end }, buffer: any, bufferSize: number = 50, fullList: [], loading: boolean) {
    let numberOfItemsFromEndBeforeFetchingMore = 10;
    if (loading || fullList.length <= buffer.length) {
      return;
    }

    if (end + numberOfItemsFromEndBeforeFetchingMore >= buffer.length) {
      this.fetchMore(buffer, bufferSize, fullList, loading);
    }
  }

  private fetchMore(buffer: any, bufferSize: number = 50, fullList: [], loading: boolean) {
    const len = buffer.length;
    const more = fullList.slice(len, bufferSize + len);
    loading = true;
    // using timeout here to simulate backend API delay
    setTimeout(() => {
      loading = false;
      buffer = buffer.concat(more);
    }, 100);
  }

}
