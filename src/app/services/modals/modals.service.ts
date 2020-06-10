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

  // FiSMA System
  private fismaSysSource = new Subject();
  currentFismaSys = this.fismaSysSource.asObservable();

  constructor() { }

  updateDetails(row: {}, component: string) {
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
    } else if (component == 'fisma') {
      this.fismaSysSource.next(row);
    } else {
      console.log("Error: Not a valid component to update details");
    }
  }
}
