import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalsService {

  // Investment Modal
  private investSource = new Subject();
  currentInvest = this.investSource.asObservable();

  // Capability Modal
  private capSource = new Subject();
  currentCap = this.capSource.asObservable();

  // Organization Modal
  private orgSource = new Subject();
  currentOrg = this.orgSource.asObservable();

  constructor() { }

  updateDetails(row: {}, component: string) {
    if (component == 'investment') {
      this.investSource.next(row);
    } else if (component == 'capability') {
      this.capSource.next(row);
    } else if (component == 'organization') {
      this.orgSource.next(row);
    } else {
      console.log("Error: Not a valid component to updaate details");
    }
  }
}
