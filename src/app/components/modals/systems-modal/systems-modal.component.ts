import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from "@services/shared/shared.service";
import { TableService } from '@services/tables/table.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems-modal',
  templateUrl: './systems-modal.component.html',
  styleUrls: ['./systems-modal.component.css']
})
export class SystemsModalComponent implements OnInit {

  system = <any>{};

  constructor(
    private location: Location,
    private modalService: ModalsService,
    private router: Router,
    public sharedService: SharedService,
    public tableService: TableService) { }

  ngOnInit(): void {
    this.modalService.currentSys.subscribe(system => this.system = system);

    // $('#childSubSysTable').bootstrapTable($.extend(this.tableService.relSysTableOptions, {
    //   columns: this.tableService.relSysColumnDefs,
    //   data: [],
    // }));

    // // Method to handle click events on the Child Sub-Systems table
    // $(document).ready(
    //   $('#childSubSysTable').on('click-row.bs.table', function (e, row) {
    //     // Hide First Modal before showing new modal
    //     $('#systemDetail').modal('hide');

    //     this.tableService.systemsTableClick(row);
    //   }.bind(this)
    //   ));

    // Revert back to overview tab when modal goes away
    $('#systemDetail').on('hidden.bs.modal', function (e) {
      $("#systemTabs li:first-child a").tab('show');
      
      // Change URL back without ID after closing Modal
      var truncatedURL = this.sharedService.coreURL(this.router.url);
      this.location.replaceState(truncatedURL);
    }.bind(this));
  }

  // Have to render POC info separately as anchor links dont work with ngFor
  renderSystemPOCInfo(pocString: string) {
    let POCs = this.splitPOCInfo(pocString)
    let html = ''

    POCs.forEach(p => {
      html += `<tr>
        <td>${p.type}</td>
        <td>${p.name}</td>`

      if (p.phone) html += `<td>
          ${p.phone.substring(0, 4)}-${p.phone.substring(4, 7)}-${p.phone.substring(7, 11)}
        </td>`
      else html += "<td>None</td>"

      if (p.email) html += `<td>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${p.email}" target="_blank" rel="noopener">
          ${p.email}</a>
      </td>`
      else html += "<td>None</td>"

      html += "</tr>"
    });
    return html;
  }

  private splitPOCInfo(p) {
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
