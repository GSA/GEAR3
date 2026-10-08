import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Column } from '@common/table-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import {
  ChatbotService,
  ChatMessage,
} from '@services/chatbot/chatbot.service';

@Component({
    selector: 'global-search',
    templateUrl: './global-search.component.html',
    styleUrls: ['./global-search.component.scss'],
    standalone: false
})
export class GlobalSearchComponent implements OnInit {

  public searchKW: string = '';
  tableData: any[] = [];
  tableDataOriginal: any[] = [];

  // AI overview + follow-up chat state
  public aiOverview: string = '';
  public aiOverviewHtml: SafeHtml = '';
  public aiLoading: boolean = false;
  // Each Q&A exchange is stored as a pair so the template can render separate sections
  public chatPairs: { question: string; answer: string | null; askedAt: string; answeredAt: string | null }[] = [];
  public chatInput: string = '';
  public chatLoading: boolean = false;
  public chatMinimized: boolean = false;
  public chatExpanded: boolean = false;
  public overviewTime: string = '';

  @ViewChild('threadContainer') private threadContainer?: ElementRef;

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private analyticsService: AnalyticsService,
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer
  ) { }

  tableCols: Column[] = [];

  ngOnInit(): void {
    // Global Search Table Columns
    this.tableCols = [{
      field: 'Name',
      header: 'Item Name',
      isSortable: true
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      formatter: this.sharedService.formatDescriptionLite,
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: false,
      formatter: this.sharedService.formatStatus,
    },
    {
      field: 'GEAR_Type_Display',
      header: 'GEAR Data Report',
      isSortable: true
    }];

    this.route.params.subscribe((params) => {
      // If the user pastes in an open global search modal url
      if(params && (params['reportType'] && params['id'])) {  
        let searchData = {
          Id: params['id'],
          GEAR_Type: params['reportType']
        };
        this.tableService.globalSearchTableClick(searchData);
      }

      if(params && params['keyword']) {
        this.searchKW = params['keyword'];
        // Reset AI state for the new search term
        this.aiOverview = '';
        this.aiOverviewHtml = '';
        this.chatPairs = [];
        this.chatInput = '';
        this.chatMinimized = false;
        this.chatExpanded = false;
        this.overviewTime = '';
        // const urlSearchParams = new URLSearchParams(this.searchKW);
        // this.apiService.getGlobalSearchResults(encodeURIComponent(this.searchKW.replace(/'/g, '%27'))).subscribe(s => {
        this.apiService.getGlobalSearchResults(encodeURIComponent(this.searchKW)).subscribe(s => {
          let sorted = this.sortBySearchTerm(s, this.searchKW, 'Name');
          this.tableService.updateReportTableData(sorted);
          this.tableService.updateReportTableDataReadyStatus(true);
          this.tableData = sorted;
          this.tableDataOriginal = sorted;

          // Request the AI overview for this term using the results just loaded
          this.loadAiOverview(this.searchKW, sorted);
        });
        // Log GA4 event
        this.analyticsService.logSearchEvent(this.searchKW);
      }
    });
  }

  /** Fetch a short AI overview of the search term given the results. */
  private loadAiOverview(searchKW: string, results: any[]): void {
    this.aiLoading = true;
    this.aiOverview = '';
    this.aiOverviewHtml = '';
    this.chatbotService.getSearchOverview(searchKW, results || []).subscribe((res) => {
      this.aiOverview = res && res.reply ? res.reply : '';
      this.aiOverviewHtml = this.renderMarkdown(this.aiOverview);
      this.overviewTime = this.formatTime(new Date());
      this.aiLoading = false;
    });
  }

  /**
   * Convert the AI assistant's lightweight markdown (**bold**, *italics*,
   * `code`, and - / • bullet lists) into sanitized HTML for display. Input is
   * HTML-escaped first so model output cannot inject markup.
   */
  public renderMarkdown(text: string): SafeHtml {
    const escaped = this.escapeHtml(text || '');

    // Split into lines so we can turn bullet runs into <ul> lists.
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

  /** Send a follow-up question after the overview; grounded via chat tools. */
  public sendFollowUp(): void {
    const text = this.chatInput.trim();
    if (!text || this.chatLoading) {
      return;
    }

    // Build history from previous pairs + overview context
    const history: ChatMessage[] = [];
    if (this.aiOverview) {
      history.push({
        role: 'assistant',
        content: `Overview for search "${this.searchKW}": ${this.aiOverview}`,
      });
    }
    for (const pair of this.chatPairs) {
      history.push({ role: 'user', content: pair.question });
      if (pair.answer) {
        history.push({ role: 'assistant', content: pair.answer });
      }
    }

    // Auto-expand to full overlay on the first follow-up question
    if (this.chatPairs.length === 0) {
      this.chatExpanded = true;
      this.chatMinimized = false;
    }

    // Add a new pending pair (answer = null until response arrives)
    this.chatPairs.push({ question: text, answer: null, askedAt: this.formatTime(new Date()), answeredAt: null });
    this.chatInput = '';
    this.chatLoading = true;
    this.scrollThreadToBottom();

    this.chatbotService.sendMessage(text, history).subscribe((res) => {
      const reply =
        res && typeof res.reply === 'string' && res.reply.trim().length > 0
          ? res.reply
          : 'Sorry, I could not generate a response. The AI service may be temporarily unavailable — please try again.';
      // Fill in the answer for the last pair
      this.chatPairs[this.chatPairs.length - 1].answer = reply;
      this.chatPairs[this.chatPairs.length - 1].answeredAt = this.formatTime(new Date());
      this.chatLoading = false;
      this.scrollThreadToBottom();
    });
  }

  private scrollThreadToBottom(): void {
    setTimeout(() => {
      if (this.threadContainer) {
        this.threadContainer.nativeElement.scrollTop =
          this.threadContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  public onFollowUpKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendFollowUp();
    }
  }

  /** Toggle the floating assistant window between expanded and minimized. */
  public toggleChatMinimized(): void {
    this.chatMinimized = !this.chatMinimized;
  }

  /** Toggle full-page expanded mode. */
  public toggleExpanded(): void {
    this.chatExpanded = !this.chatExpanded;
    // Ensure body is visible when expanding
    if (this.chatExpanded) {
      this.chatMinimized = false;
    }
  }

  public onRowClick(e: any): void {
    const data = e;
    const searchTerm: string = data.tableSearchString || '';
    switch (data.GEAR_Type) {
      case 'System':
        this.router.navigate(['/systems/', data.Id], { 
          queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
          } 
        });
        break;
      case 'FISMA':
        this.router.navigate(['/FISMA/', data.Id], {
           queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
           }
        });
        break;
      case 'Technology':
        this.router.navigate(['/it_standards/', data.Id], {
           queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
           }
        });
        break;
      case 'Capability':
        this.router.navigate(['/capabilities/', data.Id], {
          queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
           } 
        });
        break;
      case 'Organization':
        this.router.navigate(['/organizations/', data.Id], {
          queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
           } 
        });
        break;
      case 'Investment':
        this.router.navigate(['/investments/', data.Id], { 
          queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
           }
        });
        break;
      case 'Website':
        this.router.navigate(['/websites/', data.Id], { 
          queryParams: { 
            search: this.searchKW,
            tableSearchTerm: searchTerm
           } 
        });
        break;
      default:
        break;
    }
  }

  private sortBySearchTerm(arr, searchTerm, key) {
    if (!Array.isArray(arr)) return arr;
    const term = (searchTerm || '').toLowerCase().trim();

    // Tiered score so that Item Name matches always outrank description-only
    // (relevance) matches. Higher score = more relevant.
    //   4000+ : exact name match
    //   3000+ : name starts with the term
    //   2000+ : whole-word name match (term appears as its own word)
    //   1000+ : name contains the term anywhere
    //      0+ : no name match (rely on DB relevance only)
    // Within each tier we add the DB `relevance` (if present) and, for the
    // "contains" tiers, favor earlier positions in the name.
    const scoreFN = (item) => {
      const rawName = item && item[key] ? String(item[key]) : '';
      const name = rawName.toLowerCase();
      const relevance = Number(item && item.relevance) || 0;

      if (!term) return relevance;

      if (name === term) return 4000 + relevance;

      const idx = name.indexOf(term);
      if (idx === -1) return relevance; // no name match

      if (idx === 0) return 3000 + relevance;

      // Whole-word match (bounded by non-word chars)
      const wordBoundary = new RegExp(
        `(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`,
        'i'
      );
      if (wordBoundary.test(name)) return 2000 + relevance;

      // Contains anywhere; earlier position is slightly better.
      return 1000 + relevance + 1 / (idx + 1);
    };

    // Stable sort: compare scores, break ties by original order.
    return arr
      .map((item, i) => ({ item, i, score: scoreFN(item) }))
      .sort((a, b) => (b.score - a.score) || (a.i - b.i))
      .map((entry) => entry.item);
  }
}