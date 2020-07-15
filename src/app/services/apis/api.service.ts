import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { catchError } from 'rxjs/operators';

import { SharedService } from "../shared/shared.service";
import { Globals } from '../../common/globals';

import { Application } from 'api/models/applications.model';
import { Capability } from 'api/models/capabilities.model';
import { FISMA } from 'api/models/fisma.model';
import { Interface } from 'api/models/interfaces.model';
import { Investment } from 'api/models/investments.model';
import { InvestmentType } from "api/models/investment-types.model";
import { ITStandards } from 'api/models/it-standards.model';
import { Organization } from 'api/models/organizations.model';
import { ParentSystem } from 'api/models/parentsystems.model';
import { POC } from 'api/models/pocs.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Applications
  appUrl: string = this.sharedService.internalURLFmt('/api/applications');

  // Capabilities
  capUrl: string = this.sharedService.internalURLFmt('/api/capabilities');

  // FISMA
  fismaUrl: string = this.sharedService.internalURLFmt('/api/fisma');

  // Investment
  investUrl: string = this.sharedService.internalURLFmt('/api/investments');

  // Investment Types
  investTypeUrl: string = this.sharedService.internalURLFmt('/api/investments/types');

  // Organizations
  orgUrl: string = this.sharedService.internalURLFmt('/api/organizations');

  // POCs
  pocUrl: string = this.sharedService.internalURLFmt('/api/pocs');

  // Parent System
  sysUrl: string = this.sharedService.internalURLFmt('/api/parentsystems');

  // IT Standards
  techUrl: string = this.sharedService.internalURLFmt('/api/it_standards');


  constructor(
    private globals: Globals,
    private http: HttpClient,
    private sharedService: SharedService) { }


  // Calls
  //// Applications
  public getApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(this.appUrl).pipe(
      catchError(this.handleError<Application[]>('GET Applications', []))
    );
  };
  public getOneApp(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(this.appUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Application[]>('GET Application', []))
    );
  };
  //// Application Interfaces
  public getAppInterfaces(id: number): Observable<Interface[]> {
    return this.http.get<Interface[]>(this.appUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Interface[]>('GET App Interfaces', []))
    );
  };

  //// Capabilities
  public getCapabilities(): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl).pipe(
      catchError(this.handleError<Capability[]>('GET Capabilities', []))
    );
  };
  public getOneCap(id: number): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Capability[]>('GET Capability', []))
    );
  };

  //// FISMA
  public getFISMA(): Observable<FISMA[]> {
    return this.http.get<FISMA[]>(this.fismaUrl).pipe(
      catchError(this.handleError<FISMA[]>('GET FISMA Systems', []))
    );
  };
  public getOneFISMASys(id: number): Observable<FISMA[]> {
    return this.http.get<FISMA[]>(this.fismaUrl + '/' + String(id)).pipe(
      catchError(this.handleError<FISMA[]>('GET FISMA System', []))
    );
  };

  //// Investment
  public getInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.investUrl).pipe(
      catchError(this.handleError<Investment[]>('GET Investments', []))
    );
  };
  public getOneInvest(id: number): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.investUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<Investment[]>('GET Investment', []))
    );
  };
  public getLatestInvest(): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.investUrl + '/latest').pipe(
      catchError(this.handleError<Investment[]>('GET Latest Investment', []))
    );
  };
  public getInvestTypes(): Observable<InvestmentType[]> {
    return this.http.get<InvestmentType[]>(this.investTypeUrl).pipe(
      catchError(this.handleError<InvestmentType[]>('GET Investment Types', []))
    );
  };
  public getInvestApps(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(this.investUrl + '/get/' + String(id) + '/applications').pipe(
      catchError(this.handleError<Application[]>('GET Investment Related Applications', []))
    );
  };
  public updateInvestment(id: number, data: {}): Observable<Investment[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Investment[]>('UPDATE Investment - No Authentication Token', []))
    }

    return this.http.put<Investment[]>(this.investUrl + '/update/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<Investment[]>('UPDATE Investment', []))
    );
  }
  public createInvestment(data: {}): Observable<Investment[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Investment[]>('CREATE Investment - No Authentication Token', []))
    }

    return this.http.post<Investment[]>(this.investUrl + '/create', data, httpOptions).pipe(
      catchError(this.handleError<Investment[]>('CREATE Investment', []))
    );
  }

  //// Organizations
  public getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.orgUrl).pipe(
      catchError(this.handleError<Organization[]>('GET Organizations', []))
    );
  };
  public getOneOrg(id: number): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.orgUrl + '/' + String(id)).pipe(
      catchError(this.handleError<Organization[]>('GET Organization', []))
    );
  };

  //// Parent Systems
  public getSystems(): Observable<ParentSystem[]> {
    return this.http.get<ParentSystem[]>(this.sysUrl).pipe(
      catchError(this.handleError<ParentSystem[]>('GET Parent Systems', []))
    );
  };
  public getOneSys(id: number): Observable<ParentSystem[]> {
    return this.http.get<ParentSystem[]>(this.sysUrl + '/' + String(id)).pipe(
      catchError(this.handleError<ParentSystem[]>('GET Parent System', []))
    );
  };

  //// POCs
  public getPOCs(): Observable<POC[]> {
    return this.http.get<POC[]>(this.pocUrl).pipe(
      catchError(this.handleError<POC[]>('GET POCs', []))
    );
  };
  public getPOC(id: number): Observable<POC[]> {
    return this.http.get<POC[]>(this.pocUrl + '/' + String(id)).pipe(
      catchError(this.handleError<POC[]>('GET POC', []))
    );
  };

  //// Technologies
  public getTechnologies(): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl).pipe(
      catchError(this.handleError<ITStandards[]>('GET IT Standards', []))
    );
  };
  public getOneTech(id: number): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl + '/' + String(id)).pipe(
      catchError(this.handleError<ITStandards[]>('GET IT Standard', []))
    );
  };


  //// Error Handler for calls
  private handleError<T>(operation: string = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(`Failed ${operation} Call: ${error.message}`);
      return of(result as T)
    };
  };

  //// Set JWT into Header Options
  setHeaderOpts() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.globals.jwtToken
      })
    };
  }

}
