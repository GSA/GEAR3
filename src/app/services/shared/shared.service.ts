import { Injectable, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { Subscription } from 'rxjs/internal/Subscription';
import { catchError } from 'rxjs/operators';

import { Capability } from 'api/models/capabilities.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // Sidebar Toggle Service
  toggleEmitter = new EventEmitter();
  subsVar: Subscription;

  // Capabilities API
  capUrl: string = this.location.prepareExternalUrl('/api/capabilities');

  constructor(
    private http: HttpClient,
    private location: Location) { }

  // Sidebar Toggle
  public toggleClick() {
    this.toggleEmitter.emit();
  }

  // API Calls
  //// Capabilities API
  public getCapabilities(): Observable<Capability[]>{
    return this.http.get<Capability[]>(this.capUrl).pipe(
      catchError(this.handleError<Capability[]>('Capabilities', []))
    )
  }


  // Error Handler for API calls
  private handleError<T>(operation: string = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(`Failed ${operation} API Call: ${error.message}`);
      return of(result as T)
    }
  }

  
}
