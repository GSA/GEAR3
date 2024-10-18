import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { Column } from '../../../common/table-classes';
import { Capability } from '@api/models/capabilities.model';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'capabilities',
  templateUrl: './capabilities.component.html',
  styleUrls: ['./capabilities.component.css'],
})
export class CapabilitiesComponent implements OnInit {
  row: Object = <any>{};
  ssoTable: boolean = false;
  filterTitle: string = '';

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentCap.subscribe((row) => (this.row = row));
  }

  tableData: Capability[] = [];

  tableCols: Column[] = [
    {
      field: 'ReferenceNum',
      header: 'Ref Id',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'Capability Name',
      isSortable: true,
    },
    {
      field: 'Description',
      header: 'Description',
      isSortable: true,
      formatter: this.sharedService.formatDescription
    },
    {
      field: 'Level',
      header: 'Level',
      isSortable: true,
    },
    {
      field: 'Parent',
      header: 'Parent',
      isSortable: true,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    this.apiService.getCapabilities().subscribe(c => this.tableData = c);

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailCapID = params['capID'];
      if (detailCapID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailCapID}`
        );
        this.apiService.getOneCap(detailCapID).subscribe((data: any[]) => {
          this.tableService.capsTableClick(data[0]);
        });
      }
    });
  }
}
