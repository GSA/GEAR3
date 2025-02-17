import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';
import { Column } from '../../../common/table-classes';
import { Organization } from '@api/models/organizations.model';

@Component({
  selector: 'organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css'],
})
export class OrganizationsComponent implements OnInit {
  row: Object = <any>{};

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentInvest.subscribe((row) => (this.row = row));
  }

  tableData: Organization[] = [];
  tableDataOriginal: Organization[] = [];

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
    this.apiService.getOrganizations().subscribe(o => {
      this.tableService.updateReportTableData(o);
      this.tableData = o;
      this.tableDataOriginal = o;
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailOrgID = params['orgID'];
      if (detailOrgID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailOrgID}`
        );
        this.apiService.getOneOrg(detailOrgID).subscribe((data: any[]) => {
          this.tableService.orgsTableClick(data[0]);
        });
      }
    });
  }
}
