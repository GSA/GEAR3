import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalsService {

  // Investment Modal
  private investSource = new Subject<any>();
  currentInvest = this.investSource.asObservable();

  constructor() { }

  updateDetails(row: any) {
    this.investSource.next(row);
  }
}
