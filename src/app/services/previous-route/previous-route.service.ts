import { Injectable } from '@angular/core';
import { Router, NavigationEnd, RoutesRecognized } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PreviousRouteService {
  private urls: string[] = [];

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      // Store the full URL, including query params
      this.urls.push(event.urlAfterRedirects);
    });
  }

  public getPreviousUrl(): string | null {
    // Return the second to last element in the array (the previous URL)
    if (this.urls.length > 1) {
      return this.urls[this.urls.length - 2];
    }
    return null;
  }
  // private previousUrl: string | null = null;
  // private currentUrl: string;

  // constructor(private router: Router) {
  //   this.currentUrl = this.router.url;
  //   router.events.pipe(
  //     filter((event): event is RoutesRecognized => event instanceof RoutesRecognized)
  //   ).subscribe((event: RoutesRecognized) => {
  //     this.previousUrl = this.currentUrl;
  //     this.currentUrl = event.urlAfterRedirects;
  //   });
  // }

  // public getPreviousUrl(): string | null {
  //   return this.previousUrl;
  // }

  public getPreviousRouteWithoutParams(): string | undefined {
    if (!this.getPreviousUrl()) {
      return undefined;
    }
    // Split the URL by '?' to remove query parameters, and by ';' to remove matrix parameters
    return this.getPreviousUrl().split('?')[0].split(';')[0];
  }
}