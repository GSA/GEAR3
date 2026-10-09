import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

import {
  ChatbotService,
  ChatMessage,
} from '@services/chatbot/chatbot.service';

/** A single question/answer exchange rendered in the thread. */
interface ChatPair {
  question: string;
  answer: string | null;
  askedAt: string;
  answeredAt: string | null;
}

@Component({
  selector: 'gear-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  standalone: false,
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  public open = false;
  public expanded = false;
  public inputText = '';
  public loading = false;
  public pairs: ChatPair[] = [];
  public unreadCount = 0;
  public copiedIndex = -1;

  private seedSub?: Subscription;
  private shouldScroll = false;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer,
    private host: ElementRef
  ) {}

  ngOnInit(): void {
    // When any part of the app (e.g. the global search) seeds a prompt, open
    // the chatbot and pre-fill the input. The user presses Send to ask.
    this.seedSub = this.chatbotService.seed$.subscribe((prompt) => {
      this.open = true;
      this.unreadCount = 0;
      this.inputText = prompt || '';
    });
  }

  ngOnDestroy(): void {
    this.seedSub?.unsubscribe();
  }

  /**
   * Minimize the panel when the user clicks anywhere outside the chatbot. The
   * conversation is preserved; only the panel is hidden.
   */
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) {
      return;
    }
    const target = event.target as Node;
    if (this.host && !this.host.nativeElement.contains(target)) {
      this.minimize();
    }
  }

  /** Close the panel on Escape for keyboard users. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.minimize();
    }
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.unreadCount = 0;
    } else {
      this.expanded = false;
    }
  }

  /** Minimize (hide the panel) without clearing the conversation. */
  minimize(): void {
    this.open = false;
    this.expanded = false;
  }

  /** Toggle between the compact and the larger expanded panel size. */
  toggleExpanded(): void {
    this.expanded = !this.expanded;
    this.shouldScroll = true;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) {
      return;
    }

    // Build history from previous pairs before adding the new question.
    const history: ChatMessage[] = [];
    for (const pair of this.pairs) {
      history.push({ role: 'user', content: pair.question });
      if (pair.answer) {
        history.push({ role: 'assistant', content: pair.answer });
      }
    }

    this.pairs.push({
      question: text,
      answer: null,
      askedAt: this.formatTime(new Date()),
      answeredAt: null,
    });
    this.inputText = '';
    this.loading = true;
    this.shouldScroll = true;

    this.chatbotService.sendMessage(text, history).subscribe((res) => {
      const reply =
        res && typeof res.reply === 'string' && res.reply.trim().length > 0
          ? res.reply
          : 'Sorry, I could not generate a response. The AI service may be temporarily unavailable — please try again.';
      const last = this.pairs[this.pairs.length - 1];
      last.answer = reply;
      last.answeredAt = this.formatTime(new Date());
      this.loading = false;
      this.shouldScroll = true;
      if (!this.open) {
        this.unreadCount++;
      }
    });
  }

  clear(): void {
    this.pairs = [];
    this.inputText = '';
  }

  public copyToClipboard(text: string | null, index: number): void {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copiedIndex = index;
        setTimeout(() => {
          this.copiedIndex = -1;
        }, 2000);
      })
      .catch(() => {});
  }

  public isErrorReply(answer: string | null): boolean {
    if (!answer) return false;
    return answer.startsWith('Sorry,');
  }

  /**
   * Convert the AI assistant's lightweight markdown (**bold**, *italics*,
   * `code`, and - / • bullet lists) into sanitized HTML for display. Input is
   * HTML-escaped first so model output cannot inject markup.
   */
  public renderMarkdown(text: string): SafeHtml {
    const escaped = this.escapeHtml(text || '');
    const lines = escaped.split(/\r?\n/);
    const htmlParts: string[] = [];
    let inList = false;

    const closeList = () => {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const bulletMatch = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
      if (bulletMatch) {
        if (!inList) {
          htmlParts.push('<ul>');
          inList = true;
        }
        htmlParts.push('<li>' + this.applyInlineFormatting(bulletMatch[1]) + '</li>');
      } else if (line.length === 0) {
        closeList();
      } else {
        closeList();
        htmlParts.push('<p>' + this.applyInlineFormatting(line) + '</p>');
      }
    }
    closeList();

    return this.sanitizer.bypassSecurityTrustHtml(htmlParts.join(''));
  }

  /** Apply inline markdown (bold, italics, inline code) on already-escaped text. */
  private applyInlineFormatting(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  /** Escape HTML special characters so model output cannot inject markup. */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (_) {
      /* no-op */
    }
  }
}
