import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/apis/api.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Record } from '@api/models/records.model';

@Component({
    selector: 'records-management-details',
    templateUrl: './records-management-details.component.html',
    styleUrls: ['./records-management-details.component.scss'],
    standalone: false
})
export class RecordsManagementDetailsComponent implements OnInit {

  public recordsMgntId: number = null;
  public detailsData: Record;
  public isDataReady: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sharedService: SharedService,
    public tableService: TableService,
    public router: Router
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.recordsMgntId = +params.get('recID');

      // Get system details
      this.apiService.getOneRecord(this.recordsMgntId).subscribe(r => {
        this.detailsData = r;
        this.isDataReady = true;
      });

    });
  }

  public editRecord(): void {
    this.router.navigate(['records_mgmt_manager', this.detailsData.Rec_ID]);
  }

  public isLoggedIn(): boolean {
    return this.sharedService.loggedIn;
  }
}
