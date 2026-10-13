import {
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

const SESSION_KEY = 'gear_chatbot_pairs';
const TYPEWRITER_INTERVAL_MS = 12;
const TYPEWRITER_MAX_TICKS = 100;

/** A single question/answer exchange rendered in the thread. */
interface ChatPair {
  question: string;
  answer: string | null;
  askedAt: string;
  answeredAt: string | null;
  askedMs: number;
  answeredMs: number | null;
}

@Component({
  selector: 'gear-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  standalone: false,
})
export class ChatbotComponent implements OnInit, OnDestroy {
  public open = false;
  public expanded = false;
  public inputText = '';
  public loading = false;
  public pairs: ChatPair[] = [];
  public unreadCount = 0;
  public copiedIndex = -1;
  public showScrollTop = false;
  public atTop = false;
  public relativeTimeTick = 0; // incremented every minute to refresh relative times

  private seedSub?: Subscription;
  private tickInterval?: ReturnType<typeof setInterval>;
  private typingAnswers = new Map<ChatPair, string>();
  private typewriterTimers = new Map<ChatPair, ReturnType<typeof setInterval>>();

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;
  @ViewChild('inputTextarea') private inputTextareaRef?: ElementRef;

  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer,
    private host: ElementRef
  ) {}

  ngOnInit(): void {
    // Restore persisted conversation from sessionStorage.
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        this.pairs = JSON.parse(stored);
      }
    } catch (_) {}

    // Refresh relative timestamps every 60 seconds.
    this.tickInterval = setInterval(() => { this.relativeTimeTick++; }, 60_000);

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
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.clearTypewriterTimers();
  }

  /**
   * Minimize the panel when the user clicks anywhere outside the chatbot. The
   * conversation is preserved; only the panel is hidden.
   */
  private _ignoreNextOutsideClick = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) {
      return;
    }
    if (this._ignoreNextOutsideClick) {
      this._ignoreNextOutsideClick = false;
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
    this._ignoreNextOutsideClick = true;
    this.expanded = !this.expanded;
    this.scrollToBottom();
  }

  onScroll(): void {
    if (this.scrollContainer) {
      const scrollTop = this.scrollContainer.nativeElement.scrollTop;
      this.showScrollTop = scrollTop > 200;
      this.atTop = scrollTop < 20;
    }
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  jumpToInput(): void {
    this.scrollToBottom();
    setTimeout(() => {
      this.inputTextareaRef?.nativeElement?.focus();
    }, 120);
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

    const now = Date.now();
    this.pairs.push({
      question: text,
      answer: null,
      askedAt: this.formatTime(new Date(now)),
      answeredAt: null,
      askedMs: now,
      answeredMs: null,
    });
    this.inputText = '';
    this.autoResizeTextarea();
    this.loading = true;
    this.scrollToBottom();

    this.chatbotService.sendMessage(text, history).subscribe({
      next: (res) => {
        const reply =
          res && typeof res.reply === 'string' && res.reply.trim().length > 0
            ? res.reply
            : 'Sorry, I could not generate a response. The AI service may be temporarily unavailable — please try again.';
        const last = this.pairs[this.pairs.length - 1];
        const answeredMs = Date.now();
        last.answer = reply;
        last.answeredAt = this.formatTime(new Date(answeredMs));
        last.answeredMs = answeredMs;
        this.typewriteAnswer(last, reply);
        this.loading = false;
        this.persistPairs();
        this.scrollToBottom();
        if (!this.open) {
          this.unreadCount++;
        }
      },
      error: () => {
        const last = this.pairs[this.pairs.length - 1];
        const answeredMs = Date.now();
        last.answer = 'Sorry, a network error occurred. Please check your connection and try again.';
        last.answeredAt = this.formatTime(new Date(answeredMs));
        last.answeredMs = answeredMs;
        this.typewriteAnswer(last, last.answer);
        this.loading = false;
        this.persistPairs();
        this.scrollToBottom();
      },
    });
  }

  clear(): void {
    this.clearTypewriterTimers();
    this.pairs = [];
    this.inputText = '';
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
  }

  public visibleAnswer(pair: ChatPair): string {
    return this.typingAnswers.get(pair) ?? pair.answer ?? '';
  }

  private typewriteAnswer(pair: ChatPair, answer: string): void {
    this.typingAnswers.set(pair, '');
    let visibleLength = 0;
    const charsPerTick = Math.max(1, Math.ceil(answer.length / TYPEWRITER_MAX_TICKS));
    const timer = setInterval(() => {
      const shouldFollow = this.isScrolledToBottom();
      visibleLength = Math.min(visibleLength + charsPerTick, answer.length);
      this.typingAnswers.set(pair, answer.slice(0, visibleLength));

      if (visibleLength >= answer.length) {
        clearInterval(timer);
        this.typewriterTimers.delete(pair);
        this.typingAnswers.delete(pair);
      }

      if (shouldFollow) {
        this.scrollToBottom();
      }
    }, TYPEWRITER_INTERVAL_MS);
    this.typewriterTimers.set(pair, timer);
  }

  private clearTypewriterTimers(): void {
    for (const timer of this.typewriterTimers.values()) {
      clearInterval(timer);
    }
    this.typewriterTimers.clear();
    this.typingAnswers.clear();
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
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /** Returns a relative label like "just now", "5 min ago", "2 hr ago", "3 days ago". */
  public relativeTime(ms: number | null): string {
    if (!ms) return '';
    // reading relativeTimeTick forces Angular to re-evaluate when tick fires
    void this.relativeTimeTick;
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  }

  public autoResizeTextarea(): void {
    const el = this.inputTextareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  private persistPairs(): void {
    try {
      // Cap at 20 most recent pairs to avoid sessionStorage size limits.
      const toStore = this.pairs.slice(-20);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(toStore));
    } catch (_) {}
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  private isScrolledToBottom(): boolean {
    const container = this.scrollContainer?.nativeElement;
    return !!container &&
      container.scrollHeight - container.scrollTop - container.clientHeight < 40;
  }
}
