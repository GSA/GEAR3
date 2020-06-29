import { Injectable, EventEmitter } from '@angular/core';
import { formatDate, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { Subscription } from 'rxjs/internal/Subscription';
import { catchError } from 'rxjs/operators';

import { Application } from 'api/models/applications.model';
import { Capability } from 'api/models/capabilities.model';
import { FISMA } from 'api/models/fisma.model';
import { Interface } from 'api/models/interfaces.model';
import { Investment } from 'api/models/investments.model';
import { ITStandards } from 'api/models/it-standards.model';
import { Organization } from 'api/models/organizations.model';
import { ParentSystem } from 'api/models/parentsystems.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // Sidebar Toggle Service
  toggleEmitter = new EventEmitter();
  subsVar: Subscription;

  // Applications API
  appUrl: string = this.internalURLFmt('/api/applications');

  // Capabilities API
  capUrl: string = this.internalURLFmt('/api/capabilities');

  // FISMA API
  fismaUrl: string = this.internalURLFmt('/api/fisma');


  // Investment API
  investUrl: string = this.internalURLFmt('/api/investments');

  // Organizations API
  orgUrl: string = this.internalURLFmt('/api/organizations');

  // Parent System API
  sysUrl: string = this.internalURLFmt('/api/parentsystems');

  // IT Standards API
  techUrl: string = this.internalURLFmt('/api/it_standards');

  constructor(
    private http: HttpClient,
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

  // API Calls
  //// Applications API
  public getApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(this.appUrl).pipe(
      catchError(this.handleError<Application[]>('Applications', []))
    );
  };
  public getOneApp(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(this.appUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Application[]>('Application', []))
    );
  };
  //// Application Interfaces API
  public getAppInterfaces(id: number): Observable<Interface[]> {
    return this.http.get<Interface[]>(this.appUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Interface[]>('App Interfaces', []))
    );
  };

  //// Capabilities API
  public getCapabilities(): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl).pipe(
      catchError(this.handleError<Capability[]>('Capabilities', []))
    );
  };
  public getOneCap(id: number): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Capability[]>('Capability', []))
    );
  };

  //// FISMA API
  public getFISMA(): Observable<FISMA[]> {
    return this.http.get<FISMA[]>(this.fismaUrl).pipe(
      catchError(this.handleError<FISMA[]>('FISMA Systems', []))
    );
  };
  public getOneFISMASys(id: number): Observable<FISMA[]> {
    return this.http.get<FISMA[]>(this.fismaUrl + '/' + String(id)).pipe(
      catchError(this.handleError<FISMA[]>('FISMA System', []))
    );
  };

  //// Investment API
  public getInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.investUrl).pipe(
      catchError(this.handleError<Investment[]>('Investments', []))
    );
  };
  public getOneInvest(id: number): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.investUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Investment[]>('Investment', []))
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

  //// Parent Systems API
  public getSystems(): Observable<ParentSystem[]> {
    return this.http.get<ParentSystem[]>(this.sysUrl).pipe(
      catchError(this.handleError<ParentSystem[]>('Parent Systems', []))
    );
  };
  public getOneSys(id: number): Observable<ParentSystem[]> {
    return this.http.get<ParentSystem[]>(this.sysUrl + '/' + String(id)).pipe(
      catchError(this.handleError<ParentSystem[]>('Parent System', []))
    );
  };

  //// Technologies API
  public getTechnologies(): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl).pipe(
      catchError(this.handleError<ITStandards[]>('IT Standards', []))
    );
  };
  public getOneTech(id: number): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl + '/' + String(id)).pipe(
      catchError(this.handleError<ITStandards[]>('IT Standard', []))
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

}
