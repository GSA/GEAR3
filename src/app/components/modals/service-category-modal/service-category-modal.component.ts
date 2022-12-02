import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'service-category-modal',
  templateUrl: './service-category-modal.component.html',
  styleUrls: ['./service-category-modal.component.css']
})
export class ServiceCategoryModalComponent implements OnInit {

  serviceCategory = <any>{};

  constructor(
    private apiService: ApiService,
    private location: Location,
    public modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService) { }

  

  ngOnInit(): void {
    this.modalService.currentServiceCategory.subscribe(serviceCategory => {
      this.serviceCategory = serviceCategory;
      console.log(serviceCategory);
      }
    );

    // Method to handle click events on the Related Systems table
    $(document).ready(
      $('#serviceCategoryRelSysTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#serviceCategoryDetail').modal('hide');

        this.tableService.systemsTableClick(row);
      }.bind(this)
      ));

    // Revert back to overview tab when modal goes away
    $('#serviceCategoryDetail').on('hidden.bs.modal', function (e) {
      $("#serviceCategoryTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      this.sharedService.removeIDfromURL();
    }.bind(this));
  }

  serviceCategoryEdit() {
    // Hide Detail Modal before showing Manager Modal
    $('#serviceCategoryDetail').modal('hide');
    this.modalService.updateDetails(this.serviceCategory, 'serviceCategory', false);
    
    // $('#serviceCategoryManager').modal('show');
  }

  
}