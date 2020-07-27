import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SharedService } from '../shared/shared.service';
import { Globals } from '../../common/globals';

// Models
import { Application } from 'api/models/applications.model';
import { ApplicationStatus } from 'api/models/application-statuses.model';
import { Interface } from 'api/models/interfaces.model';
import { HostProvider } from 'api/models/application_host_providers';

import { Capability } from 'api/models/capabilities.model';

import { FISMA } from 'api/models/fisma.model';

import { Investment } from 'api/models/investments.model';
import { InvestmentType } from 'api/models/investment-types.model';

import { ITStandards } from 'api/models/it-standards.model';
import { ITStandard508Status } from 'api/models/it-standards-508_statuses.model';
import { ITStandardCategory } from 'api/models/it-standards-categories.model';
import { ITStandardDeployTypes } from 'api/models/it-standards-deploy_types.model';
import { ITStandardStatus } from 'api/models/it-standards-statuses.model';
import { ITStandardTypes } from 'api/models/it-standards-types.model';

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
    return this.http.get<Application[]>(this.appUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<Application[]>('GET Application', []))
    );
  };
  public getLatestApp(): Observable<Application[]> {
    return this.http.get<Application[]>(this.appUrl + '/latest').pipe(
      catchError(this.handleError<Application[]>('GET Latest Application', []))
    );
  };
  public getAppTechnologies(id: number): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.appUrl + '/get/' + String(id) + '/technologies').pipe(
      catchError(this.handleError<ITStandards[]>('GET App Related Technologies', []))
    );
  };
  public getAppInterfaces(id: number): Observable<Interface[]> {
    return this.http.get<Interface[]>(this.appUrl + '/get/' + String(id) + '/interfaces').pipe(
      catchError(this.handleError<Interface[]>('GET App Interfaces', []))
    );
  };
  public getAppStatuses(): Observable<ApplicationStatus[]> {
    return this.http.get<ApplicationStatus[]>(this.appUrl + '/statuses').pipe(
      catchError(this.handleError<ApplicationStatus[]>('GET Application Statuses', []))
    );
  };
  public getHostProviders(): Observable<HostProvider[]> {
    return this.http.get<HostProvider[]>(this.appUrl + '/host_providers').pipe(
      catchError(this.handleError<HostProvider[]>('GET Application Host Providers', []))
    );
  };
  public updateApplication(id: number, data: {}): Observable<Application[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Application[]>('UPDATE Application - No Authentication Token', []))
    }

    return this.http.put<Application[]>(this.appUrl + '/update/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<Application[]>('UPDATE Application', []))
    );
  };
  public createApplication(data: {}): Observable<Application[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Application[]>('CREATE Application - No Authentication Token', []))
    }

    return this.http.post<Application[]>(this.appUrl + '/create', data, httpOptions).pipe(
      catchError(this.handleError<Application[]>('CREATE Application', []))
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
  };
  public createInvestment(data: {}): Observable<Investment[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Investment[]>('CREATE Investment - No Authentication Token', []))
    }

    return this.http.post<Investment[]>(this.investUrl + '/create', data, httpOptions).pipe(
      catchError(this.handleError<Investment[]>('CREATE Investment', []))
    );
  };


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
    return this.http.get<ParentSystem[]>(this.sysUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<ParentSystem[]>('GET Parent System', []))
    );
  };
  public getLatestSys(): Observable<ParentSystem[]> {
    return this.http.get<ParentSystem[]>(this.sysUrl + '/latest').pipe(
      catchError(this.handleError<ParentSystem[]>('GET Latest Parent System', []))
    );
  };
  public getChildApps(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(this.sysUrl + '/get/' + String(id) + '/applications').pipe(
      catchError(this.handleError<Application[]>('GET System Child Applications', []))
    );
  };
  public updateParentSys(id: number, data: {}): Observable<ParentSystem[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<ParentSystem[]>('UPDATE Parent System - No Authentication Token', []))
    }

    return this.http.put<ParentSystem[]>(this.sysUrl + '/update/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<ParentSystem[]>('UPDATE Parent System', []))
    );
  };
  public createParentSys(data: {}): Observable<ParentSystem[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<ParentSystem[]>('CREATE Parent System - No Authentication Token', []))
    }

    return this.http.post<ParentSystem[]>(this.sysUrl + '/create', data, httpOptions).pipe(
      catchError(this.handleError<ParentSystem[]>('CREATE Parent System', []))
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


  //// IT-Standards
  public getITStandards(): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl).pipe(
      catchError(this.handleError<ITStandards[]>('GET IT Standards', []))
    );
  };
  public getOneITStandard(id: number): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<ITStandards[]>('GET IT Standard', []))
    );
  };
  public getLatestITStand(): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.techUrl + '/latest').pipe(
      catchError(this.handleError<ITStandards[]>('GET Latest IT Standard', []))
    );
  };
  public getITStandApps(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(this.investUrl + '/get/' + String(id) + '/applications').pipe(
      catchError(this.handleError<Application[]>('GET IT Standard Related Applications', []))
    );
  };
  public getITStand508Statuses(): Observable<ITStandard508Status[]> {
    return this.http.get<ITStandard508Status[]>(this.techUrl + '/508_compliance').pipe(
      catchError(this.handleError<ITStandard508Status[]>('GET IT Standard 508 Compliance Statuses', []))
    );
  };
  public getITStandCategories(): Observable<ITStandardCategory[]> {
    return this.http.get<ITStandardCategory[]>(this.techUrl + '/categories').pipe(
      catchError(this.handleError<ITStandardCategory[]>('GET IT Standard Categories', []))
    );
  };
  public getITStandDeploymentTypes(): Observable<ITStandardDeployTypes[]> {
    return this.http.get<ITStandardDeployTypes[]>(this.techUrl + '/deployment_types').pipe(
      catchError(this.handleError<ITStandardDeployTypes[]>('GET IT Standard Deployment Types', []))
    );
  };
  public getITStandStatuses(): Observable<ITStandardStatus[]> {
    return this.http.get<ITStandardStatus[]>(this.techUrl + '/statuses').pipe(
      catchError(this.handleError<ITStandardStatus[]>('GET IT Standard Statuses', []))
    );
  };
  public getITStandTypes(): Observable<ITStandardTypes[]> {
    return this.http.get<ITStandardTypes[]>(this.techUrl + '/types').pipe(
      catchError(this.handleError<ITStandardTypes[]>('GET IT Standard Types', []))
    );
  };
  public updateITStandard(id: number, data: {}): Observable<ITStandards[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<ITStandards[]>('UPDATE IT Standard - No Authentication Token', []))
    }

    return this.http.put<ITStandards[]>(this.techUrl + '/update/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<ITStandards[]>('UPDATE IT Standard', []))
    );
  }
  public createITStandard(data: {}): Observable<ITStandards[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<ITStandards[]>('CREATE Standard - No Authentication Token', []))
    }

    return this.http.post<ITStandards[]>(this.techUrl + '/create', data, httpOptions).pipe(
      catchError(this.handleError<ITStandards[]>('CREATE IT Standard', []))
    );
  }


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
