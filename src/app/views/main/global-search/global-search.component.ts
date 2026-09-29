import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  public aiLoading: boolean = false;
  public chatMessages: ChatMessage[] = [];
  public chatInput: string = '';
  public chatLoading: boolean = false;

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private analyticsService: AnalyticsService,
    private chatbotService: ChatbotService
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
        this.chatMessages = [];
        this.chatInput = '';
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
    this.chatbotService.getSearchOverview(searchKW, results || []).subscribe((res) => {
      this.aiOverview = res && res.reply ? res.reply : '';
      this.aiLoading = false;
    });
  }

  /** Send a follow-up question after the overview; grounded via chat tools. */
  public sendFollowUp(): void {
    const text = this.chatInput.trim();
    if (!text || this.chatLoading) {
      return;
    }

    // Seed the conversation with the overview so follow-ups have context.
    const history: ChatMessage[] = [];
    if (this.aiOverview) {
      history.push({
        role: 'assistant',
        content: `Overview for search "${this.searchKW}": ${this.aiOverview}`,
      });
    }
    history.push(...this.chatMessages);

    this.chatMessages.push({ role: 'user', content: text });
    this.chatInput = '';
    this.chatLoading = true;

    this.chatbotService.sendMessage(text, history).subscribe((res) => {
      const reply =
        res && typeof res.reply === 'string' && res.reply.trim().length > 0
          ? res.reply
          : 'Sorry, I could not generate a response for that. The AI service may be temporarily rate-limited or over budget - please wait a moment and try again.';
      this.chatMessages.push({ role: 'assistant', content: reply });
      this.chatLoading = false;
    });
  }

  public onFollowUpKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendFollowUp();
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