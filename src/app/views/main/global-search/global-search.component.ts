import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ITStandards } from '@api/models/it-standards.model';
import { Column } from '@common/table-classes';
import { AnalyticsService } from '@services/analytics/analytics.service';
import { ApiService } from '@services/apis/api.service';

import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

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

  public aiResponse;
  public aiPrompt;

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

        this.sendAIPrompt();

        this.apiService.getGlobalSearchResults(encodeURIComponent(this.searchKW)).subscribe(s => {
          let sorted = this.sortBySearchTerm(s, this.searchKW, 'Name');
          this.tableService.updateReportTableData(sorted);
          this.tableService.updateReportTableDataReadyStatus(true);
          this.tableData = sorted;
          this.tableDataOriginal = sorted;
        });
        // Log GA4 event
        this.analyticsService.logSearchEvent(this.searchKW);
      }
    });
  }

  sendAIPrompt() {
    const sampleData = {
      "messages": [
        {
          "content": `You must use only data from the following urls:
                        1. https://ea.gsa.gov/api/it_standards
                        2. https://ea.gsa.gov/api/websites`,
          "role": "system"
        },
        {
          "content": `This is what the user is searching for: ${this.searchKW}.`,
          "role": "system"
        },
        {
          "content": `Return your response as stringified json with the following rules:
                        1. Do not include any back ticks, line breaks, new lines or anything else that might throw an error when passing the string into
                            a JSON.parse() function.
                        2. Reiterate what you think the user is trying to search for as a simple 1-3 sentence response at the beginning inside a property
                            called 'intro'.
                        3. In a second property called 'responseType', return either 'ITStandard' or 'Website' based on what you think the user is searching for.
                        4. Follow any prompt specific JSON property names.`,
          "role": "system"
        },
        {
          "content": `If the responseType is 'ITStandard' use this prompt:
                        Return a list of approved GSA IT Standards that would be a good alternative to the searched for IT Standard. If the searched for IT Standard
                        is already approved also return it at the top of the list. Along with the IT Standards, also return a short description of the searched
                        for IT Standard if it's approved and for every alternative return the reasoning why it would be a good alternative along with a pros
                        and cons list. If a technology doesn't appear in the ITStandards data set and it isn't approved it cannot be listed as an alternative.
                        Use the following JSON property names for each piece of data returned:
                          1. Approved searched for IT Standard 'Name' should be in a property called 'searchedStandard' and its 'ID' should be in a property called 'searchedId'.
                          2. Alternatives should be listed out in an array called 'alternatives'
                            2a. each alternative should have a property 'itStandardTitle' that holds the IT Standard 'Name', 'itStandardId' that holds the
                              IT Standard 'ID', 'reasoning' that holds the reason why this makes a good alternative, an array of pros called 'pros'
                              and an array of cons called 'cons'`,
          "role": "user"
        },
        {
        "content": `If the responseType is 'Website' only return the string 'You searched for a website'.`,
        "role": "user"
        }
      ],
      "model": "gemini-2.5-flash"
    };
    this.apiService.getAITest(sampleData).subscribe({
      next: (data) => {
        const rawStr = data.choices[0].message.content;
        const cleansedStr = rawStr.replace(/^```json|```$/g, "");
        this.aiResponse = JSON.parse(cleansedStr);
        // this.aiResponse = JSON.parse(data.choices[0].message.content);
      },
      error: (err) => console.error(err)
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
}