import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { FilterButton, Column, TwoDimArray } from '../../../common/table-classes';
import { FISMA } from '@api/models/fisma.model';

@Component({
  selector: 'fisma',
  templateUrl: './fisma.component.html',
  styleUrls: ['./fisma.component.scss'],
})
export class FismaComponent implements OnInit {
  public selectedTab: string = 'All';
  public filterTotals: any = null;
  public fismaData: FISMA[] = [];
  public fismaTabFilterted: FISMA[] = [];

  row: Object = <any>{};
  // retiredTable: boolean = false;

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentFismaSys.subscribe((row) => (this.row = row));
  }

  // tableData: FISMA[] = [];
  // tableDataOriginal: FISMA[] = [];
  // filteredTableData: FISMA[] = [];

  // filterButtons: TwoDimArray<FilterButton> = [
  //   [
  //     {
  //       buttonText: 'Retired Fisma Systems',
  //       filters: [
  //         { field: 'Status', value: 'Inactive' }
  //       ]
  //     }
  //   ]
  // ];

  tableCols: Column[] = [
    {
      field: 'ID',
      header: 'ID',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Name',
      header: 'System Name',
      isSortable: true,
    },
    {
      field: 'Status',
      header: 'Status',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'ATODate',
      header: 'ATO Date',
      isSortable: true,
      formatter: this.sharedService.dateFormatter,
    },
    {
      field: 'RenewalDate',
      header: 'Renewal Date',
      isSortable: true,
      formatter: this.sharedService.dateFormatter,
    },
    {
      field: 'ATOType',
      header: 'ATO Type',
      isSortable: true,
    },
    {
      field: 'FIPS_Impact_Level',
      header: 'FIPS Impact Level',
      isSortable: true,
    },
    {
      field: 'RelatedArtifacts',
      header: 'Related Artifacts',
      isSortable: true,
      formatter: this.sharedService.relArtifactsFormatter,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      showColumn: true,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'ParentName',
      header: 'Parent System',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'Reportable',
      header: 'FISMA Reportable',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'PII',
      header: 'PII',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'CUI',
      header: 'CUI',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'FedContractorLoc',
      header: 'Fed or Contractor System',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'RespOrg',
      header: 'Responsible Org',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'ServiceType',
      header: 'Cloud Service Type',
      isSortable: true,
      showColumn: false,
    },
    {
      field: 'FISMASystemIdentifier',
      header: 'FISMA System Identifier',
      isSortable: true,
      showColumn: false
    },
  ];

  ngOnInit(): void {
    this.apiService.getFISMA().subscribe(fisma => {
      this.fismaData = fisma;
      fisma.forEach(f => {
        if(f.Status === 'Active' && f.SystemLevel === 'System' && f.Reportable === 'Yes') {
          this.fismaTabFilterted.push(f);
        }
      });
      this.tableService.updateReportTableData(this.fismaTabFilterted);
    });

    this.apiService.getFismaFilterTotals().subscribe(t => {
      this.filterTotals = t;
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailFismaID = params['fismaID'];
      if (detailFismaID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailFismaID}`
        );
        this.apiService
          .getOneFISMASys(detailFismaID)
          .subscribe((data: any[]) => {
            this.tableService.fismaTableClick(data[0]);
          });
      }
    });
  }

  public onSelectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.fismaTabFilterted = this.fismaData;

    if(this.selectedTab === 'All') {
      this.fismaTabFilterted = this.fismaData.filter(f => {
        return f.Status === 'Active' && f.SystemLevel === 'System' && f.Reportable === 'Yes';
      });
    } else if (this.selectedTab === 'Retired') {
      this.fismaTabFilterted = this.fismaData.filter(f => {
        return f.Status === 'Inactive';
      });
    }
    this.tableService.updateReportTableData(this.fismaTabFilterted);
  }

  public isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  // onFilterClick(filterButtons: FilterButton[]) {
  //   this.tableData = this.tableDataOriginal;
  //   this.tableService.filterButtonClick(filterButtons, this.tableData);
  // }

  // onFilterResetClick() {
  //   this.tableData = this.filteredTableData;
  //   this.tableService.updateReportTableData(this.tableData);
  // }
}
