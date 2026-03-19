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
import { DataDictionary } from '@api/models/data-dictionary.model';
import { TRM } from '@api/models/trm.model';

@Component({
    selector: 'tech-categories',
    templateUrl: './tech-categories.component.html',
    styleUrls: ['./tech-categories.component.scss'],
    standalone: false
})
export class TechCategoriesComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    public sharedService: SharedService,
    private tableService: TableService,
    private router: Router
  ) {}

  tableData: TRM[] = [];
  tableDataOriginal: TRM[] = [];

  public attrDefinitions: DataDictionary[] = [];

  tableCols: Column[] = [
    {
      field: 'Id',
      header: 'Id',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'Name',
      isSortable: true,
    },
    {
      field: 'Area',
      header: 'Area',
      isSortable: true,
    },
    {
      field: 'Domain',
      header: 'Domain',
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
      field: 'Type',
      header: 'Type',
      isSortable: true,
    },
    {
      field: 'FEACode',
      header: 'FEA Code',
      isSortable: true,
      showColumn: false
    },
  ];

  ngOnInit(): void {
    this.apiService.getTRM().subscribe(t => {
      this.tableService.updateReportTableData(t);
      this.tableService.updateReportTableDataReadyStatus(true);
      this.tableData = t;
      this.tableDataOriginal = t;
    });

    this.apiService.getDataDictionaryByReportName('TRM').subscribe(defs => {
      this.attrDefinitions = defs
    });
  }

  public onRowClick(e: any) {
    // const searchTerm: string = e.tableSearchString || '';
    // this.router.navigate(['/tech_categories', e.ID], {
    //     queryParams: { tableSearchTerm: searchTerm }
    // });
    this.router.navigate(['/tech_categories', e.Id]);
  }
}
