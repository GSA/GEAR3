import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject, throwError } from 'rxjs';
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

  /**
   * Emits a prompt that the global chatbot widget should open with and
   * pre-fill (e.g. the global search term). The widget subscribes to this so
   * any component can seed a question without owning its own chat panel.
   */
  private seedSubject = new Subject<string>();
  public seed$ = this.seedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private sharedService: SharedService
  ) {}

  /**
   * Open the global chatbot and pre-fill its input with `prompt`. Used by the
   * global search so searching feeds the chatbot without a separate panel.
   */
  seedPrompt(prompt: string): void {
    this.seedSubject.next(prompt);
  }

  sendMessage(message: string, history: ChatMessage[]): Observable<ChatResponse> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http
      .post<ChatResponse>(this.chatUrl, { message, history }, httpOptions)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 429) {
            return of({ reply: 'Sorry, the AI service is currently rate-limited. Please wait a moment and try again.' } as ChatResponse);
          }
          console.log(`Failed POST Chat Call: ${error.message}`);
          return of({ reply: 'Sorry, the GEAR Assistant is temporarily unavailable. Please try again.' } as ChatResponse);
        })
      );
  }
}
