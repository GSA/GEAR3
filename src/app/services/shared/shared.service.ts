import { Injectable, EventEmitter } from '@angular/core';
import { formatDate, Location } from '@angular/common';
import { Subscription } from 'rxjs/internal/Subscription';

import { Globals } from '@common/globals';

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

  systemFormEmitter = new EventEmitter();
  systemFormSub: Subscription;

  appFormEmitter = new EventEmitter();
  appFormSub: Subscription;

  itStandardsFormEmitter = new EventEmitter();
  itStandardsFormSub: Subscription;

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

  // Find value of Item in Array by Key (ID by default, else value of specified field)
  findInArray(array: any[], arrayKey: string, searchItem: any, field: string = null) {
    var result: any = array.find(element => element[arrayKey] === searchItem);

    if (result) {
      if (field) return result[field];
      else return result.ID;
    };
  };

  // Have to render POC info separately as anchor links dont work with ngFor
  renderPOCInfo(pocString: string) {
    let POCs = this.splitPOCInfo(pocString)
    let html = ''

    POCs.forEach(p => {
      html += `<li>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${p.email}" target="_blank"
          rel="noopener">${p.name}</a>`;

      if (p.org) html += `, ${p.org}`;
      else html += ", No Org Provided";
      html += "</li>";
    });
    return html;
  }

  // Split POC info when multiple are given in a field
  splitPOCInfo(p) {
    var pocs = null;
    var pocObjs = [];

    if (p) {
      pocs = p.split(';');

      pocs = pocs.map((poc, tmpObj) => {
        let pieces = poc.split(', ');

        tmpObj = {
          name: pieces[0],
          email: pieces[1],
          org: pieces[2]
        }

        pocObjs.push(tmpObj);
      })
    }

    return pocObjs;
  }


  // JWT Handling
  //// Set JWT on log in to be tracked when checking for authentication
  public setJWTonLogIn(): void {
    if (localStorage.getItem('jwt') !== null) {  // If successful set of JWT
      setTimeout(() => {
        this.globals.jwtToken = localStorage.getItem('jwt');
        this.globals.authUser = localStorage.getItem('user');
        $('#loggedIn').toast('show');
      }, 1000);  // Wait for 1 sec to propogate after logging in
    }
  }

  //// Check if user is authenticated to GEAR Manager
  public get loggedIn(): boolean {
    return localStorage.getItem('jwt') !== null && localStorage.getItem('jwt') == this.globals.jwtToken;
  };


  // Table Data Formatters
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

    if (value == '' || value == undefined) { finalVal = "N/A" };

    return finalVal;
  };


  // Set Forms Default
  public setInvestForm() {
    this.investFormEmitter.emit();
  };

  public setSystemForm() {
    this.systemFormEmitter.emit();
  };

  public setAppForm() {
    this.appFormEmitter.emit();
  };

  public setITStandardsForm() {
    this.itStandardsFormEmitter.emit();
  };


  // Only include the core URL path and no parameters
  public coreURL(url) {
    var re = new RegExp(/^\/\w*(?=\/\d*|$)/);
    var match = re.exec(url);
    return match[0];
  };

}
