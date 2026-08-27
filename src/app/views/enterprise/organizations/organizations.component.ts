import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { Column } from '../../../common/table-classes';
import { Organization } from '@api/models/organizations.model';
import { DataDictionary } from '@api/models/data-dictionary.model';

@Component({
    selector: 'organizations',
    templateUrl: './organizations.component.html',
    styleUrls: ['./organizations.component.scss'],
    standalone: false
})
export class OrganizationsComponent implements OnInit {
  row: Object = <any>{};

  public attrDefinitions: DataDictionary[] = [];

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private tableService: TableService,
    private titleService: Title,
    private router: Router
  ) {
    this.modalService.currentInvest.subscribe((row) => (this.row = row));
  }

  tableData: Organization[] = [];
  tableDataOriginal: Organization[] = [];

  totalRecords: number = 0;

  tableCols: Column[] = [
    {
      field: 'OrgSymbol',
      header: 'Org Symbol',
      isSortable: true,
    },
    {
      field: 'Name',
      header: 'Organization Name',
      isSortable: true,
    },
    {
      field: 'SSOName',
      header: 'SSO Name',
      isSortable: true,
    },
    {
      field: 'TwoLetterOrgSymbol',
      header: 'Two Letter Org',
      isSortable: true,
    },
    {
      field: 'TwoLetterOrgName',
      header: 'Two Letter Org Name',
      isSortable: true,
    },
  ];

  ngOnInit(): void {
    this.apiService.getDataDictionaryByReportName('Organization').subscribe(defs => {
      this.attrDefinitions = defs;
    });

    // Initial load: first page
    this.loadPage({ page: 1, pageSize: 50, sortField: 'OrgSymbol', sortOrder: 1, search: '' });
  }

  public loadPage(event: { page: number; pageSize: number; sortField: string; sortOrder: number; search: string }): void {
    this.tableService.updateReportTableDataReadyStatus(false);
    this.apiService.getOrganizationsPaginated(
      event.page,
      event.pageSize,
      event.sortField,
      event.sortOrder,
      event.search
    ).subscribe(result => {
      this.tableData = result.data;
      this.totalRecords = result.total;
      this.tableService.updateReportTableData(result.data);
      this.tableService.updateReportTableDataReadyStatus(true);
    });
  }

  public onRowClick(e: any) {
    const searchTerm: string = e.tableSearchString || '';
    this.router.navigate(['/organizations', e.ID], {
        queryParams: { tableSearchTerm: searchTerm }
    });
  }
}
