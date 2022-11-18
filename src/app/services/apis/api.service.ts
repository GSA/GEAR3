import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SharedService } from '@services/shared/shared.service';
import { Globals } from '@common/globals';

// Models
import { DataFlow } from '@api/models/dataflow.model';

import { Capability } from '@api/models/capabilities.model';

import { FISMA } from '@api/models/fisma.model';

import { Investment } from '@api/models/investments.model';
import { InvestmentType } from '@api/models/investment-types.model';

import { ITStandards } from '@api/models/it-standards.model';
import { ITStandard508Status } from '@api/models/it-standards-508_statuses.model';
import { ITStandardCategory } from '@api/models/it-standards-categories.model';
import { ITStandardDeployTypes } from '@api/models/it-standards-deploy_types.model';
import { ITStandardStatus } from '@api/models/it-standards-statuses.model';
import { ITStandardTypes } from '@api/models/it-standards-types.model';

import { Organization } from '@api/models/organizations.model';

import { POC } from '@api/models/pocs.model';

import { Record } from '@api/models/records.model';

import { System } from '@api/models/systems.model';
import { TIME } from '@api/models/systime.model';
import { Website } from '@api/models/websites.model';
import { WebsiteScan } from '@api/models/website-scan.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Capabilities
  capUrl: string = this.sharedService.internalURLFmt('/api/capabilities');

  // Data Flow
  dataFlowUrl: string = this.sharedService.internalURLFmt('/api/data_flow')

  // FISMA
  fismaUrl: string = this.sharedService.internalURLFmt('/api/fisma');

  // Global Search
  globalSearchUrl: string = this.sharedService.internalURLFmt('/api/search/');

  // Investment
  investUrl: string = this.sharedService.internalURLFmt('/api/investments');

  // Investment Types
  investTypeUrl: string = this.sharedService.internalURLFmt('/api/investments/types');

  // Organizations
  orgUrl: string = this.sharedService.internalURLFmt('/api/organizations');

  // POCs
  pocUrl: string = this.sharedService.internalURLFmt('/api/pocs');

  // Records Management
  recordsUrl: string = this.sharedService.internalURLFmt('/api/records');

  // Systems
  sysUrl: string = this.sharedService.internalURLFmt('/api/systems');

  // Systems TIME
  timeUrl: string = this.sharedService.internalURLFmt('/api/system_time');

  // IT Standards
  techUrl: string = this.sharedService.internalURLFmt('/api/it_standards');

  // Websites
  websitesUrl: string = this.sharedService.internalURLFmt('/api/websites');

  constructor(
    private globals: Globals,
    private http: HttpClient,
    private sharedService: SharedService) { }


  // Calls
  //// Capabilities
  public getCapabilities(): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl).pipe(
      catchError(this.handleError<Capability[]>('GET Capabilities', []))
    );
  };
  public getOneCap(id: number): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<Capability[]>('GET Capability by ID', []))
    );
  };
  public getOneCapName(name: string): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.capUrl + '/getByName/' + name).pipe(
      catchError(this.handleError<Capability[]>('GET Capability by name', []))
    );
  };
  public getCapOrgs(id: number): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.capUrl + '/get/' + String(id) + '/orgs').pipe(
      catchError(this.handleError<Organization[]>('GET Capability Related Orgs', []))
    );
  };
  public updateCapOrgs(id: number, data: {}): Observable<Capability[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Capability[]>('UPDATE Business Capabilities-Orgs - No Authentication Token', []))
    }

    return this.http.put<Capability[]>(this.capUrl + '/updateOrgs/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<Capability[]>('UPDATE Business Capability-Orgs', []))
    );
  };


  //// Data Flow
  public getDataFlows(): Observable<DataFlow[]> {
    return this.http.get<DataFlow[]>(this.dataFlowUrl).pipe(
      catchError(this.handleError<DataFlow[]>('GET Data Flows', []))
    );
  };
  public getOneDataFlow(id: number): Observable<DataFlow[]> {
    return this.http.get<DataFlow[]>(this.dataFlowUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<DataFlow[]>('GET Data Flow', []))
    );
  };


  //// FISMA
  public getFISMA(): Observable<FISMA[]> {
    return this.http.get<FISMA[]>(this.fismaUrl).pipe(
      catchError(this.handleError<FISMA[]>('GET FISMA Systems', []))
    );
  };
  public getOneFISMASys(id: number): Observable<FISMA[]> {
    return this.http.get<FISMA[]>(this.fismaUrl + '/get/' + String(id)).pipe(
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
  public getInvestSys(id: number): Observable<System[]> {
    return this.http.get<System[]>(this.investUrl + '/get/' + String(id) + '/systems').pipe(
      catchError(this.handleError<System[]>('GET Investment Related Systems', []))
    );
  };
  // public updateInvestment(id: number, data: {}): Observable<Investment[]> {
  //   if (this.globals.jwtToken) {
  //     var httpOptions = this.setHeaderOpts();
  //   } else {
  //     catchError(this.handleError<Investment[]>('UPDATE Investment - No Authentication Token', []))
  //   }

  //   return this.http.put<Investment[]>(this.investUrl + '/update/' + String(id), data, httpOptions).pipe(
  //     catchError(this.handleError<Investment[]>('UPDATE Investment', []))
  //   );
  // };
  // public createInvestment(data: {}): Observable<Investment[]> {
  //   if (this.globals.jwtToken) {
  //     var httpOptions = this.setHeaderOpts();
  //   } else {
  //     catchError(this.handleError<Investment[]>('CREATE Investment - No Authentication Token', []))
  //   }

  //   return this.http.post<Investment[]>(this.investUrl + '/create', data, httpOptions).pipe(
  //     catchError(this.handleError<Investment[]>('CREATE Investment', []))
  //   );
  // };


  //// Organizations
  public getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.orgUrl).pipe(
      catchError(this.handleError<Organization[]>('GET Organizations', []))
    );
  };
  public getOneOrg(id: number): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.orgUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<Organization[]>('GET Organization', []))
    );
  };
  public getOrgCap(id: number): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.orgUrl + '/get/' + String(id) + '/capabilities').pipe(
      catchError(this.handleError<Capability[]>('GET Business Capabilities for Organization', []))
    );
  };
  public getOrgSys(name: string): Observable<System[]> {
    return this.http.get<System[]>(this.orgUrl + '/get/' + name + '/systems').pipe(
      catchError(this.handleError<System[]>('GET Systems for Organization', []))
    );
  };


  //// POCs
  public getPOCs(): Observable<POC[]> {
    return this.http.get<POC[]>(this.pocUrl).pipe(
      catchError(this.handleError<POC[]>('GET POCs', []))
    );
  };
  public getPOC(id: number): Observable<POC[]> {
    return this.http.get<POC[]>(this.pocUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<POC[]>('GET POC', []))
    );
  };


  //// Records Management
  public getRecords(): Observable<Record[]> {
    return this.http.get<Record[]>(this.recordsUrl).pipe(
      catchError(this.handleError<Record[]>('GET Records', []))
    );
  };
  public getOneRecord(id: number): Observable<Record[]> {
    return this.http.get<Record[]>(this.recordsUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<Record[]>('GET Record', []))
    );
  };
  public getRecordSys(id: number): Observable<System[]> {
    return this.http.get<System[]>(this.recordsUrl + '/get/' + String(id) + '/systems').pipe(
      catchError(this.handleError<System[]>('GET Systems for Record', []))
    );
  };
  public updateRecordSys(id: number, data: {}): Observable<Record[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Record[]>('UPDATE Record-System - No Authentication Token', []))
    }

    return this.http.put<Record[]>(this.recordsUrl + '/updateSystems/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<Record[]>('UPDATE Record-System', []))
    );
  };


  //// Systems
  public getSystems(): Observable<System[]> {
    return this.http.get<System[]>(this.sysUrl).pipe(
      catchError(this.handleError<System[]>('GET Systems', []))
    );
  };
  public getOneSys(id: number): Observable<System[]> {
    return this.http.get<System[]>(this.sysUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<System[]>('GET System', []))
    );
  };
  // public getChildSubSys(id: number): Observable<System[]> {
  //   return this.http.get<System[]>(this.sysUrl + '/get/' + String(id) + '/systems').pipe(
  //     catchError(this.handleError<System[]>('GET System Child Sub-Systems', []))
  //   );
  // };
  public getSysCapabilities(id: number): Observable<Capability[]> {
    return this.http.get<Capability[]>(this.sysUrl + '/get/' + String(id) + '/capabilities').pipe(
      catchError(this.handleError<Capability[]>('GET System Related Business Capabilities', []))
    );
  };
  public updateSystemCaps(id: number, data: {}): Observable<System[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<System[]>('UPDATE System-Business Capabilities - No Authentication Token', []))
    }

    return this.http.put<System[]>(this.sysUrl + '/updateCaps/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<System[]>('UPDATE System-Business Capabilities', []))
    );
  };
  public getSysInvestments(id: number): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.sysUrl + '/get/' + String(id) + '/investments').pipe(
      catchError(this.handleError<Investment[]>('GET System Related Investments', []))
    );
  };
  public updateSystemInvestments(id: number, data: {}): Observable<System[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<System[]>('UPDATE System-IT Standards - No Authentication Token', []))
    }

    return this.http.put<System[]>(this.sysUrl + '/updateInvest/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<System[]>('UPDATE System-Investments', []))
    );
  };
  public getSysRecords(id: number): Observable<Record[]> {
    return this.http.get<Record[]>(this.sysUrl + '/get/' + String(id) + '/records').pipe(
      catchError(this.handleError<Record[]>('GET System Related Records', []))
    );
  };
  public getSysWebsites(id: number): Observable<Website[]> {
    return this.http.get<Website[]>(this.sysUrl + '/get/' + String(id) + '/website').pipe(
      catchError(this.handleError<Website[]>('GET System Related Websites', []))
    );
  };
  public getSysITStandards(id: number): Observable<ITStandards[]> {
    return this.http.get<ITStandards[]>(this.sysUrl + '/get/' + String(id) + '/technologies').pipe(
      catchError(this.handleError<ITStandards[]>('GET System Related Technologies', []))
    );
  };
  public updateSystemTech(id: number, data: {}): Observable<System[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<System[]>('UPDATE System-IT Standards - No Authentication Token', []))
    }

    return this.http.put<System[]>(this.sysUrl + '/updateTech/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<System[]>('UPDATE System-IT Standards', []))
    );
  };
  public getSysTIME(id: number): Observable<TIME[]> {
    return this.http.get<TIME[]>(this.sysUrl + '/get/' + String(id) + '/time').pipe(
      catchError(this.handleError<TIME[]>('GET TIME by System', []))
    );
  };


  //// TIME
  public getTIME(): Observable<TIME[]> {
    return this.http.get<TIME[]>(this.timeUrl).pipe(
      catchError(this.handleError<TIME[]>('GET TIME', []))
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
  // public getITStandApps(id: number): Observable<Application[]> {
  //   return this.http.get<Application[]>(this.investUrl + '/get/' + String(id) + '/applications').pipe(
  //     catchError(this.handleError<Application[]>('GET IT Standard Related Applications', []))
  //   );
  // };
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


  //// Websites
  public getWebsites(): Observable<Website[]> {
    return this.http.get<Website[]>(this.websitesUrl).pipe(
      catchError(this.handleError<Website[]>('GET Websites', []))
    );
  };
  public getOneWebsite(id: number): Observable<Website[]> {
    return this.http.get<Website[]>(this.websitesUrl + '/get/' + String(id)).pipe(
      catchError(this.handleError<Website[]>('GET Website', []))
    );
  };
  public getWebsiteScans(id: number): Observable<WebsiteScan[]> {
    return this.http.get<WebsiteScan[]>(this.websitesUrl + '/get/' + String(id) + '/scans').pipe(
      catchError(this.handleError<WebsiteScan[]>('GET Scans for Website', []))
    );
  };
  public getOneWebsiteScan(id: number, scanId: number): Observable<WebsiteScan[]> {
    return this.http.get<WebsiteScan[]>(this.websitesUrl + '/get/' + String(id) + '/scans/' + String(scanId)).pipe(
      catchError(this.handleError<WebsiteScan[]>('GET One Scan for Website', []))
    );
  }
  public getWebsiteSys(id: number): Observable<System[]> {
    return this.http.get<System[]>(this.websitesUrl + '/get/' + String(id) + '/systems').pipe(
      catchError(this.handleError<System[]>('GET Systems for Website', []))
    );
  };
  public updateWebsiteSys(id: number, data: {}): Observable<Website[]> {
    if (this.globals.jwtToken) {
      var httpOptions = this.setHeaderOpts();
    } else {
      catchError(this.handleError<Website[]>('UPDATE Website-System - No Authentication Token', []))
    }

    return this.http.put<Website[]>(this.websitesUrl + '/updateSystems/' + String(id), data, httpOptions).pipe(
      catchError(this.handleError<Website[]>('UPDATE Website-System', []))
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
  };

}
