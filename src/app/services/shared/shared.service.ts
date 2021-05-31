import { Injectable, EventEmitter } from '@angular/core';
import { formatDate, Location } from '@angular/common';
import { Subscription } from 'rxjs/internal/Subscription';
import { Router } from '@angular/router';

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
  itStandardsFormEmitter = new EventEmitter();
  itStandardsFormSub: Subscription;

  systemFormEmitter = new EventEmitter();
  systemFormSub: Subscription;

  constructor(
    private globals: Globals,
    private location: Location,
    private router: Router) { }

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
  renderPOCInfoList(pocString: string) {
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
  };

  //// Check if user is authenticated to GEAR Manager
  public get loggedIn(): boolean {
    return localStorage.getItem('jwt') !== null && localStorage.getItem('jwt') == this.globals.jwtToken;
  };

  //// Set Redirect Path to come back to page after GEAR Manager login
  public setRedirectPath(): void {
    localStorage.setItem('redirectPath', this.router.url);
  };

  //// Remove JWT and show log out banner when logging out of GEAR Manager
  public logoutManager() {
    localStorage.removeItem('jwt');
    $('#loggedOut').toast('show');
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

  //// Related Artifacts
  public relArtifactsFormatter(value, row, index, field) {
    var artifacts = value;
    var artLinks = [];

    if (artifacts) {
      var arts = artifacts.split(';');

      arts = arts.map((artifact, tmpObj) => {
        let pieces = artifact.split(',');
        let linkStr = `<a target="_blank" rel="noopener" href="${pieces[1]}">${pieces[0]}</a>`

        artLinks.push(linkStr);
      })
    }

    return artLinks.join('<br>');
  };

  //// File Link
  public linksFormatter(value, row, index, field) {
    if (value) return `<a target="_blank" rel="noopener" href="${value}">Link</a>`;
  };

  //// Date
  public dateFormatter(value, row, index, field) {
    if (value) return formatDate(value, 'MMM. dd, yyyy', 'en-US');
  };


  //// Email
  public emailFormatter(value, row, index, field) {
    return `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${value}" target="_blank" rel="noopener">${value}</a>`
  };

  //// POC Name
  public pocStringNameFormatter(value, row, index, field) {
    let poc = value.split(':')[1];  // Retrieve POC after colon
    poc = poc.split(', ');
    let name = poc[0];

    return name;
  };

  //// None Provided
  public noneProvidedFormatter(value, row, index, field) {
    if (!value) return 'None Provided';
    else return value;
  };


  // Set Forms Default
  public setITStandardsForm() {
    this.itStandardsFormEmitter.emit();
  };

  public setSystemForm() {
    this.systemFormEmitter.emit();
  };


  // Only include the core URL path and no parameters
  public coreURL(url) {
    var re = new RegExp(/^\/\w*(?=\/\d*|$)/);
    var match = re.exec(url);
    return match[0];
  };

  //Change URL to include ID when clicking on a table item
  public addIDtoURL(row) {
    var normalizedURL = this.coreURL(this.router.url);
    this.location.replaceState(`${normalizedURL}/${row.ID}`);
  };

}
