import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { Column } from '../../../common/table-classes';
import { Capability } from '@api/models/capabilities.model';

@Component({
  selector: 'capabilities',
  templateUrl: './capabilities.component.html',
  styleUrls: ['./capabilities.component.scss'],
})
export class CapabilitiesComponent implements OnInit {
  public defExpanded: boolean = false;

  row: Object = <any>{};
  ssoTable: boolean = false;
  filterTitle: string = '';

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentCap.subscribe((row) => (this.row = row));
  }

  tableData: Capability[] = [];
  tableDataOriginal: Capability[] = [];

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
    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    this.apiService.getCapabilities().subscribe(c => {
      this.tableService.updateReportTableData(c);
      this.tableData = c;
      this.tableDataOriginal = c;
    });

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

  public onViewAll(): void {
    this.defExpanded = !this.defExpanded;
  }
}
