import { Injectable } from '@angular/core';

@Injectable()
export class Globals {
  jwtToken: string = null;
  authUser: string = null;

  modalRoutes: any[] = [];
}