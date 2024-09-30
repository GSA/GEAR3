import {Injectable, EventEmitter} from '@angular/core';
import {formatDate, Location} from '@angular/common';
import {Subscription} from 'rxjs/internal/Subscription';
import {Router} from '@angular/router';

import {Globals} from '@common/globals';

import jwtDecode from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { set } from 'd3';

// Declare jQuery symbol
declare var $: any;
declare var gtag: Function;

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

  public sidebarVisible: boolean = false;

  constructor(
    private globals: Globals,
    private location: Location,
    private router: Router,
    private http: HttpClient
    ) {
  }

  // Toggle sidebar open/closed
  public toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible; 
  }

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
    this.verifyCookies();
  }

  verifyCookies() : void {    
    //console.log('requesting cookies...'); // debug
    this.http.get('/verify', {
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .subscribe(response => {
      //console.log('verifying cookies response: ', response); // debug
      const cookies : any = response;
      try {
        if (cookies.GSAGEARAPIT && cookies.GSAGEARManUN) {
          //console.log('GEAR Manager cookie found in response', cookies); // debug
          // Set JWT in globals
          this.globals.jwtToken = cookies.GSAGEARAPIT;
          this.globals.authUser = cookies.GSAGEARManUN;
          this.globals.apiToken = cookies.GSAGEARAPIT;
          // Show logged in banner
          $('#loggedIn').toast('show');
        } else {
          //console.log('GEAR Manager cookie NOT found in response: ', cookies); // debug
          this.globals.jwtToken = '';
          this.globals.authUser = '';
          this.globals.apiToken = '';
        }
      } catch (error) {
        console.error('An error occurred while /verify response: ', error);
        //console.log('Error Response: ', cookies); // debug
      }
    }
    , error => {
      console.error('An error occurred while verifying cookies', error);
    });
  }

  //// Check if user is authenticated to GEAR Manager
  public get loggedIn(): boolean {

    if (this.globals.jwtToken === "" || this.globals.jwtToken === null ||
        this.globals.apiToken === "" || this.globals.apiToken === null || 
        this.globals.authUser === "" || this.globals.authUser === null) {
      return false;
    }

    if (this.globals.jwtToken/* === localStorage.getItem('jwt')*/ &&
        this.globals.authUser/* === localStorage.getItem('user')*/ &&
        this.globals.apiToken/* === localStorage.getItem('apiToken')*/) {
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
    // remove cookies
    this.http.post('/logout', {
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .subscribe(response => {
      const cookies : any = response;
      if (cookies.GSAGEARAPIT || cookies.GSAGEARManUN) {
        console.error('Logout failed to complete');
      } else {
        //console.log('Logout SUCESS:', cookies); // debug
        // remove globals
        this.globals.jwtToken = '';
        this.globals.authUser = '';
        this.globals.apiToken = '';
        // show logged out banner
        $('#loggedOut').toast('show');
      }
    }, error => {
      console.error('An error occurred while logging out Gear Manager', error); 
    });
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


  //// Non ISO Dates
  public utcDateFormatter(value) {
    if(value) {
      let d = new Date(value);
      let day = d.getUTCDate();
      let month = d.getUTCMonth() + 1; // month range is 0-11
      let year = d.getUTCFullYear();

      return `${month}/${day}/${year}`;
    }
  }

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

  //// Description formattter
  public formatDescription(value: any, row: any) {
    if (!value) return '';
    else return '<p class="description-wrap">' + value + "</p>";;
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

    // Send page_view event to GA
    gtag('event', 'page_view', { 'page_path': `${normalizedURL}/${row[IDname]}` });
  };

  // cookies functions ---------------------------------------

  // get a cookie by name
  public getCookie(name: string) {
    const ca: Array<string> = document.cookie.split(';');
    const caLen: number = ca.length;
    const cookieName = `${name}=`;
    let c: string;
  
    for (let i = 0; i < caLen; i += 1) {
      c = ca[i].replace(/^\s+/g, '');
      if (c.indexOf(cookieName) === 0) {
        return c.substring(cookieName.length, c.length);
      }
    }
    return '';
  }
  
  // delete a cookie by name
  public deleteCookie(name) {
    this.setCookie(name, '', -1);
  }
  
  // set a cookie
  public setCookie(name: string, value: string, expireDays: number, path: string = '') {
    const d: Date = new Date();
    d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
    const expires: string = `expires=${d.toUTCString()}`;
    const cpath: string = path ? `; path=${path}` : '';
    document.cookie = `${name}=${value}; ${expires}${cpath}`;
  }

  // get a list of all cookies
  public getCookies() {
    const pairs = document.cookie.split(';');
    const cookies = {};
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split('=');
      cookies[(pair[0] + '').trim()] = unescape(pair.slice(1).join('='));
    }
    return cookies;
  }

  public enableStickyHeader(tableComponentId: string, closestScrollableClass: string = '.ng-sidebar__content') {
    $('#'+tableComponentId).floatThead({
      scrollContainer: function($table) {
        return $table.closest(closestScrollableClass);
      },
      position: "fixed",
      autoReflow: true
    });
  }

  public disableStickyHeader(tableComponentId: string) {
    $('#'+tableComponentId).floatThead('destroy');
  }
}