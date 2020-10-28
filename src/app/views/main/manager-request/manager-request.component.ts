import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';

@Component({
  selector: 'manager-request',
  templateUrl: './manager-request.component.html',
  styleUrls: ['./manager-request.component.css']
})
export class ManagerRequestComponent implements OnInit {

  mngrRequestForm: FormGroup = new FormGroup({
    mngrFirstName: new FormControl(null, [Validators.required]),
    mngrLastName: new FormControl(null, [Validators.required]),
    mngrEmail: new FormControl(null, [Validators.required,
      Validators.pattern(/^.+@gsa.gov$/)]),
    mngrOrgCode: new FormControl(null, [Validators.required]),
    supervisorEmail: new FormControl(null, [Validators.required,
      Validators.pattern(/^.+@gsa.gov$/)]),
    bizNeed: new FormControl(null, [Validators.required])
  });

  submitComplete: boolean = false;
  page: string = null;
  requestor: string = null;
  email: string = null;

  constructor(
    private apiService: ApiService,
    public modalService: ModalsService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe((params) => {
        this.page = params.page;
        this.requestor = params.requestor;
        this.email = params.email;

        var requestorData = {
          name: this.requestor,
          email: this.email
        };

        if (this.requestor && this.email) {
          if (this.page === 'accept') {
            this.apiService.mngrRequestAccept(requestorData);
          } else if (this.page === 'reject') {
            this.apiService.mngrRequestReject(requestorData);
          }
        };
      });
  }

  submitForm(): void {
    // console.log("Form: ", this.mngrRequestForm);  // Debug

    this.apiService.gearMngrRequest(this.mngrRequestForm.value).toPromise()
      .then(res => {
        this.apiService.mngrRequestSendEmail(this.mngrRequestForm.value).toPromise()
          .then(res => {
            this.submitComplete = true
          });
      });
  }

}
