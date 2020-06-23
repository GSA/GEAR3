import { Injectable, EventEmitter } from '@angular/core';
import { formatDate, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { Subscription } from 'rxjs/internal/Subscription';
import { catchError } from 'rxjs/operators';

import { Capability } from 'api/models/capabilities.model';
import { Organization } from 'api/models/organizations.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // Sidebar Toggle Service
  toggleEmitter = new EventEmitter();
  subsVar: Subscription;

  // Capabilities API
  capUrl: string = this.location.prepareExternalUrl('/api/capabilities');

  // Organizations API
  orgUrl: string = this.location.prepareExternalUrl('/api/organizations');

  constructor(
    private http: HttpClient,
    private location: Location) { }

  // Sidebar Toggle
  public toggleClick() {
    this.toggleEmitter.emit();
  };

  // File Name Formatting
  public fileNameFmt (name: string) {
    // Append current date time to filename
    var currentDate = formatDate(Date.now(), 'MMM_dd_yyyy-HH_mm', 'en-US');
    return name + '-' + currentDate;
  };


  // API Calls
  //// Capabilities API
  public getCapabilities(): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl).pipe(
      catchError(this.handleError<Capability[]>('Capabilities', []))
    );
  };
  public getOneCapability(id: number): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Capability[]>('Capability', []))
    );
  };

  //// Organizations API
  public getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.orgUrl).pipe(
      catchError(this.handleError<Organization[]>('Organizations', []))
    );
  };
  public getOneOrg(id: number): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.orgUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Organization[]>('Organization', []))
    );
  };


  //// Error Handler for API calls
  private handleError<T>(operation: string = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(`Failed ${operation} API Call: ${error.message}`);
      return of(result as T)
    };
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
      finalVal = "N/A";
    }

    return finalVal;
  };

}
