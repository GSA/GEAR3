import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface NavEntry {
  url: string;
  title: string | null;
}

const SESSION_KEY = 'gear3_nav_history';
const MAX_HISTORY = 20;

@Injectable({
  providedIn: 'root'
})
export class PreviousRouteService {
  private history: NavEntry[] = [];

  constructor(private router: Router) {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch {}

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this.history.push({ url: event.urlAfterRedirects, title: null });
      this.persist();
    });
  }

  public setCurrentPageTitle(title: string): void {
    if (this.history.length > 0) {
      this.history[this.history.length - 1].title = title;
      this.persist();
    }
  }

  public getPreviousEntry(): NavEntry | null {
    if (this.history.length > 1) {
      return this.history[this.history.length - 2];
    }
    return null;
  }

  public getPreviousUrl(): string | null {
    return this.getPreviousEntry()?.url ?? null;
  }

  public getPreviousRouteWithoutParams(): string | undefined {
    const prev = this.getPreviousUrl();
    if (!prev) return undefined;
    return prev.split('?')[0].split(';')[0];
  }

  private persist(): void {
    try {
      const trimmed = this.history.length > MAX_HISTORY ? this.history.slice(-MAX_HISTORY) : this.history;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
    } catch {}
  }
}
