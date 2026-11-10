import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  public static readonly DEFAULT_EXPIRE_HOURS = 12;
  public static readonly DEFAULT_PATH = '';

  public getCookie(name: string): string {
    const ca: Array<string> = document.cookie.split(';');
    const cookieName = `${name}=`;
    let c: string;

    for (let i = 0; i < ca.length; i += 1) {
      c = ca[i].replace(/^\s+/g, '');
      if (c.indexOf(cookieName) === 0) {
        return c.substring(cookieName.length, c.length);
      }
    }
    return '';
  }

  public setCookie(name: string, value: string, expireHours: number = CookieService.DEFAULT_EXPIRE_HOURS, path: string = CookieService.DEFAULT_PATH) {
    const d: Date = new Date();
    d.setTime(d.getTime() + expireHours * 60 * 60 * 1000);
    const expires: string = `expires=${d.toUTCString()}`;
    const cpath: string = path ? `; path=${path}` : '';
    document.cookie = `${name}=${value}; ${expires}${cpath}`;
  }

  public deleteCookie(name: string, path: string = CookieService.DEFAULT_PATH): void {
    this.setCookie(name, '', -1, path);
  }

  public setJsonCookie<T>(name: string, value: T, expireHours: number = CookieService.DEFAULT_EXPIRE_HOURS, path: string = CookieService.DEFAULT_PATH): void {
    this.setCookie(name, JSON.stringify(value), expireHours, path);
  }

  public getJsonCookie<T>(name: string): T | null {
    const raw = this.getCookie(name);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      return null;
    }
  }

  public getCookies() {
    const pairs = document.cookie.split(';');
    const cookies = {} as any;
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split('=');
      cookies[(pair[0] + '').trim()] = unescape(pair.slice(1).join('='));
    }
    return cookies;
  }
}
