import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';
import { TableService } from '../../../services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'fisma-modal',
  templateUrl: './fisma-modal.component.html',
  styleUrls: ['./fisma-modal.component.css']
})
export class FismaModalComponent implements OnInit {

  fisma = <any>{};

  constructor(
    private modalService: ModalsService,
    private tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentFismaSys.subscribe(fisma => this.fisma = fisma);

    $('#fismaCertAppsTable').bootstrapTable($.extend(this.tableService.relAppsTableOptions, {
      columns: this.tableService.relAppsColumnDefs,
      data: [],
    }));
    
    // Method to handle click events on the Certified Apps table
    $(document).ready(
      $('#fismaCertAppsTable').on('click-row.bs.table', function (e, row) {
        // Hide First Modal before showing new modal
        $('#fismaDetail').modal('hide');
        
        this.tableService.appsTableClick(row);
      }.bind(this)
    ));
  }

  splitRelArtifacts (artifacts) {
    var artObjs = [];

    if (artifacts) {
      var arts = artifacts.split(';');
      for (let index = 0; index < arts.length; index++) {
        let tmpObj: any = {};
        const art = arts[index];
        let pieces = art.split(',');

        tmpObj.name = pieces[0];
        tmpObj.link = pieces[1];
        
        artObjs.push(tmpObj);
      }
    }

    return artObjs;
  }

  splitFismaPOCInfo (p) {
    let poc = null;
    let poc1 = null;
    let pocs = [];

    if (p) {
      poc1 = p.split('*');
      poc1 = poc1.map((poctype, tmpObj) => {
        poctype = poctype.split(':');
        poc = poctype[1].split('; ');
        for (var i = 0; i < poc.length; i++) {
          var pieces = poc[i].split(',');
          tmpObj = null;
          if (pieces[0] !== '')
            tmpObj = {
              type: poctype[0],
              name: pieces[0],
              phone: pieces[2],
              email: pieces[1],
            };
          pocs.push(tmpObj);
        }
      })
    }

    return pocs.filter(function (el) {
      return el != null;
    });
  }

}
