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

/**
 * Bounds for re-pinning the thread to the bottom while the panel's size is
 * still animating (`.gear-chatbot-panel` transitions over 250ms).
 */
const SCROLL_SETTLE_MAX_MS = 450;
const SCROLL_SETTLE_STABLE_FRAMES = 3;

/** A single question/answer exchange rendered in the thread. */
interface ChatPair {
  question: string;
  answer: string | null;
  askedAt: string;
  answeredAt: string | null;
  askedMs: number;
  answeredMs: number | null;
  logId: number | null;
  feedback: 'up' | 'down' | null;
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
  public scrolledIntoHistory = false;
  private _lastScrollTop = 0;
  private _scrollUpTimer?: ReturnType<typeof setTimeout>;
  public relativeTimeTick = 0; // incremented every minute to refresh relative times

  private seedSub?: Subscription;
  private tickInterval?: ReturnType<typeof setInterval>;
  private typingAnswers = new Map<ChatPair, string>();
  private typewriterTimers = new Map<ChatPair, ReturnType<typeof setInterval>>();
  /**
   * Memoized markdown render, keyed by the exact source text.
   *
   * renderMarkdown() is called from the template, and bypassSecurityTrustHtml()
   * returns a new object every call. Angular compares [innerHTML] by reference,
   * so an unmemoized call makes every change-detection pass look like a change
   * and rebuild the bubble's DOM. That destroyed and recreated each anchor
   * roughly every 58ms, so a real click (mousedown -> mouseup across frames)
   * never completed even though the href was correct.
   */
  private renderedMarkdown = new Map<string, SafeHtml>();

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
      // Same as toggle(): a freshly opened panel starts at the top, so show
      // the newest message instead.
      this.scrollToBottom(true);
    });
  }

  ngOnDestroy(): void {
    this.seedSub?.unsubscribe();
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this._scrollUpTimer) clearTimeout(this._scrollUpTimer);
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
      // The panel is removed from the DOM while minimized, so it is rebuilt
      // scrolled to the top. Restore the view to the newest message.
      this.scrollToBottom(true);
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
    // Resizing the panel re-flows the thread, so let the height settle.
    this.scrollToBottom(true);
  }

  onScroll(): void {
    this.syncScrollFlags();
  }

  scrollToTop(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  jumpToInput(): void {
    // Leaving the top removes the "New question" banner, which changes the
    // thread's height mid-scroll, so settle on the real bottom.
    this.scrollToBottom(true);
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
      logId: null,
      feedback: null,
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
        last.logId = res.logId ?? null;
        this.typewriteAnswer(last, reply);
        this.loading = false;
        this.persistPairs();
        this.scrollToBottom();
        this.syncScrollFlags();
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
        this.syncScrollFlags();
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

  public submitFeedback(pair: ChatPair, value: 'up' | 'down'): void {
    if (pair.feedback === value) return; // already voted
    if (!pair.logId) {
      pair.feedback = value;
      this.persistPairs();
      return;
    }
    pair.feedback = value;
    this.persistPairs();
    this.chatbotService.sendFeedback(pair.logId, value).subscribe();
  }

  /** Show feedback buttons only once the answer is fully typed out. */
  public showFeedbackFor(index: number): boolean {
    const pair = this.pairs[index];
    return !!pair && !this.typingAnswers.has(pair);
  }

  public isErrorReply(answer: string | null): boolean {
    if (!answer) return false;
    return answer.startsWith('Sorry,');
  }

  /**
   * Convert the AI assistant's lightweight markdown (**bold**, *italics*,
   * `code`, [links](url), and - / • bullet lists) into sanitized HTML for
   * display. Input is HTML-escaped first so model output cannot inject markup.
   *
   * The result is memoized by source text so repeated change-detection passes
   * receive the SAME SafeHtml reference and Angular leaves the rendered DOM
   * alone — see renderedMarkdown for why that matters.
   */
  public renderMarkdown(text: string): SafeHtml {
    const source = text || '';
    const cached = this.renderedMarkdown.get(source);
    if (cached) return cached;

    const escaped = this.escapeHtml(source);
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

    const rendered = this.sanitizer.bypassSecurityTrustHtml(htmlParts.join(''));

    // The typewriter effect calls this once per frame with a growing prefix, so
    // bound the cache. Evict the oldest entry (insertion order) rather than
    // clearing all at once, which would thrash completed-message entries.
    if (this.renderedMarkdown.size >= 200) {
      const oldest = this.renderedMarkdown.keys().next().value;
      if (oldest !== undefined) this.renderedMarkdown.delete(oldest);
    }
    this.renderedMarkdown.set(source, rendered);
    return rendered;
  }

  /** Apply inline markdown (links, bold, italics, inline code) on already-escaped text. */
  private applyInlineFormatting(text: string): string {
    return text
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) =>
        this.renderLink(label, href)
      )
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  /**
   * Render a markdown link as an anchor, allowing only safe schemes.
   *
   * The link text comes from the model, so the URL is whitelisted rather than
   * trusted: in-app hash routes, same-origin paths, mailto, and absolute http(s).
   * Anything else (javascript:, data:, etc.) renders as plain text.
   *
   * In-app links deliberately open in the same tab so a GEAR record replaces
   * the current view behind the chatbot; external links get a new tab.
   */
  private renderLink(label: string, href: string): string {
    // escapeHtml() has already run, so & appears as &amp; in the captured URL.
    let url = href.replace(/&amp;/g, '&');

    // Models frequently prepend a host to the relative in-app links we supply
    // (e.g. "https://gear.gsa.gov#/it_standards/3381"). Normalize those back to
    // the hash route so navigation stays in-app and works in every environment.
    url = url.replace(/^https?:\/\/[^/#]+\/?(?=#\/)/i, '');

    const isInApp = url.startsWith('#/') || url.startsWith('/');
    const isMail = /^mailto:/i.test(url);
    const isHttp = /^https?:\/\//i.test(url);

    if (!isInApp && !isMail && !isHttp) return label;

    const target = isHttp ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${target}>${label}</a>`;
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
      const serialized = JSON.stringify(toStore);
      // Guard against QuotaExceededError by catching and retrying with fewer pairs.
      try {
        sessionStorage.setItem(SESSION_KEY, serialized);
      } catch (quotaErr) {
        // Retry with only the 5 most recent pairs to fit within quota.
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.pairs.slice(-5)));
      }
    } catch (_) {}
  }

  /**
   * Scroll the thread to the newest message.
   *
   * @param settle Set when the thread's geometry is still changing, which is
   *   true for every path that reveals or resizes the panel: it is destroyed
   *   while minimized, `.gear-chatbot-panel` animates its size over 250ms, and
   *   `syncScrollFlags()` itself adds/removes the top banner and the
   *   "Back to top" button. A single jump in those cases lands short of the
   *   real bottom, so the position is re-pinned each frame until the measured
   *   height stops moving. Streaming calls act on a stable container and use
   *   the cheap single jump, preserving the smooth CSS follow-along.
   */
  private scrollToBottom(settle = false): void {
    const pin = () => {
      const el = this.scrollContainer?.nativeElement;
      if (!el) return null;
      // 'instant' overrides the element's CSS scroll-behavior: during a settle
      // the smooth animation would visibly crawl up from the top.
      if (settle) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
      this.syncScrollFlags();
      return el.scrollHeight;
    };

    if (!settle) {
      requestAnimationFrame(pin);
      return;
    }

    const deadline = Date.now() + SCROLL_SETTLE_MAX_MS;
    let lastHeight = -1;
    let stableFrames = 0;
    const step = () => {
      const height = pin();
      if (height === null) return;
      stableFrames = height === lastHeight ? stableFrames + 1 : 0;
      lastHeight = height;
      if (stableFrames < SCROLL_SETTLE_STABLE_FRAMES && Date.now() < deadline) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  /** Recompute the scroll-affordance flags from the container's position. */
  private syncScrollFlags(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    // Show "back to top" only when the user has scrolled up away from the
    // bottom — not just because they're 200px in. We hide it while loading
    // (answer populating) and while the input is focused / being typed in.
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    this.showScrollTop = !atBottom && el.scrollTop > 200 && !this.loading;
    this.atTop = el.scrollTop < 20;
  }

  private isScrolledToBottom(): boolean {
    const container = this.scrollContainer?.nativeElement;
    return !!container &&
      container.scrollHeight - container.scrollTop - container.clientHeight < 40;
  }
}
