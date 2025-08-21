import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Organization } from '@api/models/organizations.model';
import { ApiService } from '@services/apis/api.service';

@Component({
    selector: 'organizations-details',
    templateUrl: './organizations-details.component.html',
    styleUrls: ['./organizations-details.component.scss'],
    standalone: false
})
export class OrganizationsDetailsComponent implements OnInit {

  public organizationId: string = null;
  public detailsData: Organization;
  public isDataReady: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.organizationId = params.get('orgID');

      // Get Capability details
      this.apiService.getOneOrg(this.organizationId).subscribe(o => {
        this.detailsData = o;
        this.isDataReady = true;
      });
    });
  }
}
