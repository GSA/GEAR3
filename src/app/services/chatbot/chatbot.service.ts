import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SharedService } from '@services/shared/shared.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  toolCalls?: { name: string; arguments: any }[];
}

/**
 * Talks to the GEAR Assistant backend (POST /api/chat), which orchestrates the
 * USAi model and the GEAR data tools (MCP tool layer).
 */
@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private chatUrl: string = this.sharedService.internalURLFmt('/api/chat');

  constructor(
    private http: HttpClient,
    private sharedService: SharedService
  ) {}

  sendMessage(message: string, history: ChatMessage[]): Observable<ChatResponse> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http
      .post<ChatResponse>(this.chatUrl, { message, history }, httpOptions)
      .pipe(
        catchError(
          this.handleError<ChatResponse>('POST Chat', {
            reply:
              'Sorry, the GEAR Assistant is temporarily unavailable. Please try again.',
          })
        )
      );
  }

  /**
   * Get a short AI overview of a search term given the GEAR search results.
   * `results` is the same array the results table renders.
   */
  getSearchOverview(
    searchKW: string,
    results: any[]
  ): Observable<ChatResponse> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http
      .post<ChatResponse>(
        `${this.chatUrl}/overview`,
        { searchKW, results },
        httpOptions
      )
      .pipe(catchError(this.handleError<ChatResponse>('POST Chat Overview', null)));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(`Failed ${operation} Call: ${error.message}`);
      return of(result as T);
    };
  }
}
