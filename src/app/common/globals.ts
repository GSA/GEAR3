import { Injectable } from '@angular/core';

@Injectable()
export class Globals {
  jwtToken: string = null;
  authUser: string = null;
  apiToken: string = null;

  modalRoutes: any[] = [];
}