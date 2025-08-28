import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ITStandardStatus } from '@api/models/it-standards-statuses.model';
import { ITStandards } from '@api/models/it-standards.model';
import { OperatingSystem } from '@api/models/operating-systems.model';
import { POC } from '@api/models/pocs.model';
import { Manufacturer } from '@api/models/tc-manufacturer.model';
import { SoftwareProduct } from '@api/models/tc-softwareproduct.model';
import { SoftwareRelease } from '@api/models/tc-softwarerelease.model';
import { SoftwareVersion } from '@api/models/tc-softwareversion.model';
import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';

@Component({
    selector: 'it-standards-manager',
    templateUrl: './it-standards-manager.component.html',
    styleUrls: ['./it-standards-manager.component.scss'],
    standalone: false
})
export class ItStandardsManagerComponent implements OnInit {

  public itStandardId: number = null;
  public detailsData: ITStandards;
  public isDataReady: boolean = false;

  public itStandard = <ITStandards>{};
  public createBool: boolean = false;
  public bufferSize = 50;

  public manufacturers: Manufacturer[] = [];
  public manufacturersLoading: boolean = false;
  public manufacturersBuffer: Manufacturer[] = [];

  public softwareProducts: SoftwareProduct[] = [];
  public softwareProductsLoading: boolean = false;
  public softwareProductsBuffer: SoftwareProduct[] = [];

  public softwareVersions: SoftwareVersion[] = [];
  public softwareVersionsLoading: boolean = false;
  public softwareVersionsBuffer: SoftwareVersion[] = [];

  public softwareReleases: SoftwareRelease[] = [];
  public softwareReleasesLoading: boolean = false;
  public softwareReleasesBuffer: SoftwareRelease[] = [];

  public endOfLifeDate: Date;

  public statuses: ITStandardStatus[];

  public POCs: POC[] = [];
  public pocsLoading: boolean = false;
  public pocsBuffer: POC[] = [];

  public operatingSystems: OperatingSystem[] = [];

  itStandardsForm: FormGroup = new FormGroup({
    tcManufacturer: new FormControl(null, [Validators.required]),
    tcSoftwareProduct: new FormControl(null, [Validators.required]),
    tcSoftwareVersion: new FormControl(null, [Validators.required]),
    tcSoftwareRelease: new FormControl(),
    tcEndOfLifeDate: new FormControl(),
    itStandStatus: new FormControl(null, [Validators.required]),
    itStandName: new FormControl(null, [Validators.required]),
    itStandPOC: new FormControl(null, [Validators.required]),
    itStandApprovedVersions: new FormControl(),
    itStandOperatingSystems: new FormControl(),
  });

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    public modalService: ModalsService
  ) {
  }

    public ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.itStandardId = +params.get('standardID');

            // Get IT standard details
            this.apiService.getOneITStandard(this.itStandardId).subscribe(s => {
                this.detailsData = s;
                this.isDataReady = true;
            });
        });
    }
}
