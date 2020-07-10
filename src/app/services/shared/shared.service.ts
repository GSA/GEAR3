import { Injectable, EventEmitter } from '@angular/core';
import { formatDate, Location } from '@angular/common';
import { Subscription } from 'rxjs/internal/Subscription';

import { Globals } from '../../common/globals';

// Declare jQuery symbol
declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // Sidebar Toggle Service
  toggleEmitter = new EventEmitter();
  toggleSub: Subscription;

  // Forms Emitter
  investFormEmitter = new EventEmitter();
  investFormSub: Subscription;

  constructor(
    private globals: Globals,
    private location: Location) { }

  // Sidebar Toggle
  public toggleClick() {
    this.toggleEmitter.emit();
  };

  // File Name Formatting
  public fileNameFmt(name: string): string {
    // Append current date time to filename
    var currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
    return name + '-' + currentDate;
  };

  // Format Internal URLs (without hash)
  public internalURLFmt(url: string): string {
    return this.location.prepareExternalUrl(url).replace('#', '');
  };


  // JWT Handling
  //// Set JWT on log in to be tracked when checking for authentication
  public setJWTonLogIn(): void {
    if (localStorage.getItem('jwt') !== null) {  // If successful set of JWT
    setTimeout(() => {
        this.globals.jwtToken = localStorage.getItem('jwt');
        $('#loggedIn').toast('show');
      }, 1000);  // Wait for 1 sec to propogate after logging in
    }
  }

  //// Check if user is authenticated to GEAR Manager
  public get loggedIn(): boolean {
    return localStorage.getItem('jwt') !== null && localStorage.getItem('jwt') == this.globals.jwtToken;
  };


  // Table Data Formatters
  //// For Long Descriptions
  public descFormatter(value, row, index, field) {
    var threshold = 180;
    if (value !== null) {
      if (value.length > threshold) return value.substring(0, threshold) + "...";
      else return value;
    }
  };

  //// Fiscal Year Breakdown
  public FYFormatter(value, row, index, field) {
    var appTime = row.AppTime;
    var re = new RegExp(field + ", ([BDEIMT123]{1,3});?");
    var match = re.exec(appTime);
    var finalVal = undefined;

    if (match != null) {  // Did it match?
      finalVal = match[1];
    }
    return finalVal;
  };

  //// Systems
  public systemFormatter(value, row, index, field) {
    var finalVal = value;

    if (value == '' || value == undefined) {
      finalVal = "N/A";
    }

    return finalVal;
  };


  // Set Investment Forms Default
  public setInvestForm() {
    this.investFormEmitter.emit();
  };

}
