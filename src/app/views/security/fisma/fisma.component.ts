import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { ButtonFilter, Column, TwoDimArray } from '../../../common/table-classes';
import { FISMA } from '@api/models/fisma.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'fisma',
  templateUrl: './fisma.component.html',
  styleUrls: ['./fisma.component.css'],
})
export class FismaComponent implements OnInit {
  row: Object = <any>{};
  retiredTable: boolean = false;

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

  tableData: FISMA[] = [];

  buttonFilters: TwoDimArray<ButtonFilter> = [
    [
      { field: 'Status', filterBtnText: 'Retired Fisma Systems', filterOn: 'Inactive' }
    ]
  ];

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
      title: 'Cloud Service Type',
      sortable: true,
      visible: false,
    },
    {
      field: 'FISMASystemIdentifier',
      title: 'FISMA System Identifier',
      sortablle: true,
      visible: false,
    }
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    this.apiService.getFISMA().subscribe(f => this.tableData = f);

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
}
