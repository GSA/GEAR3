import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { catchError } from 'rxjs/operators';

import { SharedService } from "../shared/shared.service";

import { Application } from 'api/models/applications.model';
import { Capability } from 'api/models/capabilities.model';
import { FISMA } from 'api/models/fisma.model';
import { Interface } from 'api/models/interfaces.model';
import { Investment } from 'api/models/investments.model';
import { ITStandards } from 'api/models/it-standards.model';
import { Organization } from 'api/models/organizations.model';
import { ParentSystem } from 'api/models/parentsystems.model';
import { POC } from 'api/models/pocs.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Applications API
  appUrl: string = this.sharedService.internalURLFmt('/api/applications');

  // Capabilities API
  capUrl: string = this.sharedService.internalURLFmt('/api/capabilities');

  // FISMA API
  fismaUrl: string = this.sharedService.internalURLFmt('/api/fisma');

  // Investment API
  investUrl: string = this.sharedService.internalURLFmt('/api/investments');

  // Organizations API
  orgUrl: string = this.sharedService.internalURLFmt('/api/organizations');
  
  // POCs API
  pocUrl: string = this.sharedService.internalURLFmt('/api/pocs');

  // Parent System API
  sysUrl: string = this.sharedService.internalURLFmt('/api/parentsystems');

  // IT Standards API
  techUrl: string = this.sharedService.internalURLFmt('/api/it_standards');


  constructor(
    private http: HttpClient,
    private sharedService: SharedService) { }


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

  //// POCs API
  public getPOCs(): Observable<POC[]> {
    return this.http.get<POC[]>(this.pocUrl).pipe(
      catchError(this.handleError<POC[]>('POCs', []))
    );
  };
  public getPOC(id: number): Observable<POC[]> {
    return this.http.get<POC[]>(this.pocUrl + '/' + String(id)).pipe(
      catchError(this.handleError<POC[]>('POC', []))
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
}
