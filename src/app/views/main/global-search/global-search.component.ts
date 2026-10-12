import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Column } from '@common/table-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { ChatbotService } from '@services/chatbot/chatbot.service';

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

        // Feed the search term to the global chatbot: open it and pre-fill the
        // input so the user can ask the GEAR Assistant about this term. The
        // results table above is independent of the chatbot.
        this.chatbotService.seedPrompt(this.searchKW);
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