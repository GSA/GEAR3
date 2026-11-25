import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { Table } from 'primeng/table';

import { TableComponent } from './table.component';
import { SharedService } from '@services/shared/shared.service';
import { CookieService } from '@services/shared/cookie.service';
import { TableService } from '@services/tables/table.service';
import { ApiService } from '@services/apis/api.service';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;
  let tableService: jasmine.SpyObj<TableService>;

  beforeEach(() => {
    tableService = jasmine.createSpyObj<TableService>(
      'TableService',
      ['updateReportTableData', 'updateReportTableDataReadyStatus', 'updateReportDataTableFilterKey'],
      {
        reportTableData$: NEVER,
        reportTableDataReady$: NEVER
      }
    );

    TestBed.configureTestingModule({
      declarations: [TableComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: SharedService, useValue: {} },
        { provide: CookieService, useValue: {} },
        { provide: TableService, useValue: tableService },
        { provide: ApiService, useValue: {} },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ActivatedRoute, useValue: { queryParams: of({}), snapshot: { params: {} } } },
        { provide: Location, useValue: { replaceState: jasmine.createSpy('replaceState') } }
      ]
    });
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ranks IT Standard Name matches above secondary description matches', () => {
    const paginator = { sortField: 'Name' } as Table;
    component['dt'] = paginator;
    component.defaultSortField = 'Name';
    component.tableCols = [
      { field: 'ID', header: 'ID' },
      { field: 'Name', header: 'IT Standard Name' },
      { field: 'Description', header: 'Description' }
    ];
    component.originalTableData = [
      { ID: 1, Name: 'node.js', Description: '' },
      { ID: 2, Name: 'node.js runtime', Description: '' },
      { ID: 3, Name: 'Atom v1.x', Description: 'A code editor built on Node.js' }
    ];

    component.onTableSearch('node.js');

    expect(component.tableData.map(row => row.ID)).toEqual([1, 2, 3]);
    expect(paginator.sortField).toBeNull();

    component.onTableSearch('');

    expect(component.isTableSearchActive).toBeFalse();
    expect(paginator.sortField).toBe('Name');
  });

  it('recognizes title fields when no default sort field is configured', () => {
    component.tableCols = [
      { field: 'Description', header: 'Description' },
      { field: 'Record_Item_Title', header: 'Record Item Title' }
    ];
    component.originalTableData = [
      { Description: 'node.js', Record_Item_Title: 'Other record' },
      { Description: 'Other description', Record_Item_Title: 'node.js record' }
    ];

    component.onTableSearch('node.js');

    expect(component.tableData[0].Record_Item_Title).toBe('node.js record');
  });

  it('recognizes Keyname as the primary field when no default sort field is configured', () => {
    component.tableCols = [
      { field: 'Description', header: 'Description' },
      { field: 'Keyname', header: 'Keyname' }
    ];
    component.originalTableData = [
      { Description: 'node.js', Keyname: 'Other record' },
      { Description: 'Other description', Keyname: 'node.js record' }
    ];

    component.onTableSearch('node.js');

    expect(component.tableData[0].Keyname).toBe('node.js record');
  });
});
