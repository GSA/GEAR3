import {Injectable, EventEmitter} from '@angular/core';
import {formatDate, Location} from '@angular/common';
import {Subscription} from 'rxjs/internal/Subscription';
import {Router} from '@angular/router';

import {Globals} from '@common/globals';

import jwtDecode from 'jwt-decode';

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
  capabilityFormEmitter = new EventEmitter();
  capabilityFormSub: Subscription;

  itStandardsFormEmitter = new EventEmitter();
  itStandardsFormSub: Subscription;

  recordFormEmitter = new EventEmitter();
  recordFormSub: Subscription;

  systemFormEmitter = new EventEmitter();
  systemFormSub: Subscription;

  websiteFormEmitter = new EventEmitter();
  websiteFormSub: Subscription;

  constructor(
    private globals: Globals,
    private location: Location,
    private router: Router) {
  }

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
    }
    ;
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

        // Set JWT in globals
        this.globals.jwtToken = localStorage.getItem('jwt');
        this.globals.authUser = localStorage.getItem('user');
        this.globals.apiToken = localStorage.getItem('apiToken');

        // Show logged in banner
        $('#loggedIn').toast('show');

        try {

          // check if the cookie exists
          if (this.getCookie('jwt') !== undefined) {

            console.log('cookies exists');

            // display the cookie
            this.displayCookie('jwt');
            this.displayCookie('gUser');
            this.displayCookie('apiToken');

          } else {

            console.log('cookies does not exist');

            console.log('current jwt: ' + this.globals.jwtToken);

            console.log('setting cookies');

            // Set JWT in cookies
            this.setCookie('gearT', this.globals.jwtToken, 1);
            this.setCookie('gUser', this.globals.authUser, 1);
            this.setCookie('apiToken', this.globals.apiToken, 1);

            // Display cookies (for debugging)
            this.displayCookie('gearT');
            this.displayCookie('gUser');
            this.displayCookie('apiToken');

          }

        } catch (e) {
          console.log('error setting and diaplaying cookies on setJWTonLogIn:', e);
        }

        // remove jwt from local storage
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        localStorage.removeItem('apiToken');

      }, 1000);  // Wait for 1 sec to propogate after logging in
    }
  }

  //// Check if user is authenticated to GEAR Manager
  public get loggedIn(): boolean {

    if (this.globals.jwtToken === "" ||
        this.globals.jwtToken === null || 
        this.globals.authUser === "" ||
        this.globals.authUser === null) {
      return false;
    }

    if (this.globals.jwtToken/* === localStorage.getItem('jwt')*/ &&
        this.globals.authUser/* === localStorage.getItem('user')*/) {
      return true;
    }

    return false;
  };

  //// Get Authenticated Username
  public get authUser(): string {
    return this.globals.authUser;
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

    if (value == '' || value == undefined) {
      finalVal = "N/A"
    }
    ;

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
    const date = new Date(value);
    if (value) return date.toLocaleDateString();
    else return null;
  };


  //// Email
  public emailFormatter(value, row, index, field) {
    return `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${value}" target="_blank" rel="noopener">${value}</a>`
  };

  //// POC Name
  public pocStringNameFormatter(value, row, index, field) {
    let names = [];
    let pocs = value.split(':')[1];  // Retrieve POC after colon
    pocs = pocs.split('; ');  // Retrieve POC after colon
    for (let i = 0; i < pocs.length; i++) {
      let singleName = pocs[i].split(', ')[0];
      if (singleName != '') names.push(singleName);  // Add only if there is a name
    }

    if (names.length === 0) return null;
    else return names.join(', ');
  };

  //// None Provided
  public noneProvidedFormatter(value, row, index, field) {
    if (!value) return 'None Provided';
    else return value;
  };


  // Set Forms Default
  public setCapabilityForm() {
    this.capabilityFormEmitter.emit();
  };

  public setITStandardsForm() {
    this.itStandardsFormEmitter.emit();
  };

  public setRecordForm() {
    this.recordFormEmitter.emit();
  };

  public setSystemForm() {
    this.systemFormEmitter.emit();
  };

  public setWebsiteForm() {
    this.websiteFormEmitter.emit();
  };

  // Only include the core URL path and no parameters
  public coreURL(url) {
    var re = new RegExp(/^\/\w*(?=\/\d*|$)/);
    var match = re.exec(url);
    return match[0];
  };

  // Change URL back without ID
  public removeIDfromURL() {
    var truncatedURL = this.coreURL(this.router.url);
    this.location.replaceState(truncatedURL);
  };

  //Change URL to include ID when clicking on a table item
  public addIDtoURL(row, IDname) {
    var normalizedURL = this.coreURL(this.router.url);
    this.location.replaceState(`${normalizedURL}/${row[IDname]}`);
  };

  // -----------------

  // get a cookie
  public getCookie(name) {
    try {
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length == 2) return parts.pop().split(";").shift();
    } catch (e) {
      console.log('error getting cookie:', e);
    }
  }

  // display a cookie (for debugging)
  public displayCookie(name) {
    try {
      //if (name === 'jwt') {
      //  console.log('cookie_decoded:', jwtDecode(this.getCookie(name)));
      //} else {
        console.log(`cookie ${name} is:`, this.getCookie(name));
      //}
    } catch (e) {
      console.log(`error displaying cookie ${name}:`, e);
    }
  }

  // set a cookie
  public setCookie(name, value, days) {
    try {
      let expires = "";
      if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // days * hours * minutes * seconds * milliseconds
        expires = "; expires=" + date.toUTCString();
      }
      // this does not work
      //document.cookie = name + "=" + (value || "") + expires + "; path=/";

      // set the cookie in the browser
      document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.gsa.gov; secure;";
    } catch (e) {
      console.log(`error setting cookie ${name}:`, e);
    }
  }

}
