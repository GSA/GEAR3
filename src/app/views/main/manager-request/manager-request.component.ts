import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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

  constructor(
    private apiService: ApiService,
    public modalService: ModalsService) { }

  ngOnInit(): void {
  }

  submitForm(): void {
    // console.log("Form: ", this.mngrRequestForm);  // Debug

    this.apiService.gearMngrRequest(this.mngrRequestForm.value).toPromise()
      .then(res => { this.submitComplete = true })
  }

}
