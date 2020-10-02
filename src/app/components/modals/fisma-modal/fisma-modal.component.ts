import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

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
    private location: Location,
    private modalService: ModalsService,
    private router: Router,
    private sharedService: SharedService,
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

    // Revert back to overview tab when modal goes away
    $('#fismaDetail').on('hidden.bs.modal', function (e) {
      $("#fismaTabs li:first-child a").tab('show');

      // Change URL back without ID after closing Modal
      var truncatedURL = this.sharedService.coreURL(this.router.url);
      this.location.replaceState(truncatedURL);
    }.bind(this));
  }

  // Have to render artifacts info separately as anchor links dont work with ngFor
  renderRelArtifacts(artifactString: string) {
    let artifacts = this.splitRelArtifacts(artifactString)
    let html = ''

    artifacts.forEach(artifact => {
      html += `<li>
        <a href="${artifact.link}" target="_blank" rel="noopener">${artifact.name}</a>
      </li>`;
    });
    return html;
  }

  private splitRelArtifacts(artifacts) {
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

  // Have to render POC info separately as anchor links dont work with ngFor
  renderFismaPOCInfo(pocString: string) {
    let POCs = this.splitFismaPOCInfo(pocString)
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

  private splitFismaPOCInfo(p) {
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
