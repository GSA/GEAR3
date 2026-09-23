import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

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

  // RAG / AI Answer state
  public ragLoading: boolean = false;
  public ragAnswer: string = '';
  public ragSources: string[] = [];

  // Follow-up chat state
  public followUpQuestion: string = '';
  public chatHistory: ChatMessage[] = [];
  public chatLoading: boolean = false;

  constructor(
    private sharedService: SharedService,
    private tableService: TableService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private analyticsService: AnalyticsService
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
        // const urlSearchParams = new URLSearchParams(this.searchKW);
        // this.apiService.getGlobalSearchResults(encodeURIComponent(this.searchKW.replace(/'/g, '%27'))).subscribe(s => {
        this.apiService.getGlobalSearchResults(encodeURIComponent(this.searchKW)).subscribe(s => {
          let sorted = this.sortBySearchTerm(s, this.searchKW, 'Name');
          this.tableService.updateReportTableData(sorted);
          this.tableService.updateReportTableDataReadyStatus(true);
          this.tableData = sorted;
          this.tableDataOriginal = sorted;
        });
        // Log GA4 event
        this.analyticsService.logSearchEvent(this.searchKW);

        // Query the RAG API for an AI answer
        this.queryRag(this.searchKW);
      }
    });
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
    const matchFN = (item) => {
      const value = item[key];
      // if no direct match return 0
      if (!value) return 0;
      // if exact match make sure it goes to the top
      if(value.toLowerCase() === searchTerm.toLowerCase()) return arr.length + 1;
      const index = value.toLowerCase().indexOf(searchTerm.toLowerCase());
      return index === -1 ? 0 : 1 / (index + 1);
    }

    arr.sort((a, b) => matchFN(b) - matchFN(a));
    return arr;
  }

  // ── RAG / AI methods ─────────────────────────────────────────────────────

  private queryRag(query: string): void {
    this.ragLoading = true;
    this.ragAnswer = '';
    this.ragSources = [];
    this.chatHistory = [];

    // TODO: Replace this dummy call with your real Databricks RAG API endpoint.
    // e.g. this.apiService.getRagAnswer(query).subscribe(res => { ... });
    this.dummyRagApi(query).then(res => {
      this.ragAnswer = res.answer;
      this.ragSources = res.sources;
      this.ragLoading = false;
    }).catch(() => {
      this.ragAnswer = '';
      this.ragLoading = false;
    });
  }

  public sendFollowUp(): void {
    const question = this.followUpQuestion?.trim();
    if (!question) return;

    this.chatHistory.push({ role: 'user', text: question });
    this.followUpQuestion = '';
    this.chatLoading = true;

    // TODO: Replace with real RAG follow-up call, passing chatHistory as context.
    this.dummyRagApi(question, this.chatHistory).then(res => {
      this.chatHistory.push({ role: 'assistant', text: res.answer });
      this.chatLoading = false;
    }).catch(() => {
      this.chatHistory.push({ role: 'assistant', text: 'Sorry, I could not retrieve an answer. Please try again.' });
      this.chatLoading = false;
    });
  }

  /** Dummy RAG API — replace with real Databricks endpoint. */
  private dummyRagApi(query: string, _history: ChatMessage[] = []): Promise<{ answer: string; sources: string[] }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          answer: `This is a dummy AI answer for "${query}". Once your Databricks RAG API is ready, this will be replaced with a real response based on your knowledge base documents.`,
          sources: ['GEAR Knowledge Base', 'IT Standards Catalog', 'Enterprise Architecture Docs']
        });
      }, 1200);
    });
  }
}