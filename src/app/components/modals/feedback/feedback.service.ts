  
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { postData} from './feedback';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class FeedbackService {
    
    
  feedbackApiUrl: string = "/service/feedback";
  
  httpOptions = {
    headers: new HttpHeaders()
    .set('Accept', 'application/vnd.api+json')
    .set('Content-Type', 'application/vnd.api+json')
  };

  constructor(private httpClient : HttpClient) {}

  /**
 * @description to request a post method
 * @param feedbackBody Data being sent
 */
  addFeedback (feedbackBody: postData) {
      //this is not making the actual api call, it's just returning an Observable object.
      return this.httpClient.post(this.feedbackApiUrl, feedbackBody, this.httpOptions)
      .pipe(
          catchError(err => {
          return of(null);
          })
      );        
  }  
}