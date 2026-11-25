import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
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
        reportTableData$: of([]),
        reportTableDataReady$: of(true)
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

  it('resets the paginator to the filtered result count after a search', fakeAsync(() => {
    const paginator = { first: 50, totalRecords: 3 } as Table;
    component['dt'] = paginator;
    component.tableCols = [{ field: 'Name', header: 'Name' }];
    component.originalTableData = [
      { Name: 'Node.js' },
      { Name: 'Node.js LTS' },
      { Name: 'Other' }
    ];
    component.tableData = [...component.originalTableData];
    component.first = 50;

    component.onTableSearch('node.js');

    expect(component.tableData.map(row => row.Name)).toEqual(['Node.js', 'Node.js LTS']);
    expect(component.first).toBe(0);
    expect(component.hasMultiplePages).toBeFalse();

    tick();

    expect(paginator.first).toBe(0);
    expect(paginator.totalRecords).toBe(2);
  }));
});
