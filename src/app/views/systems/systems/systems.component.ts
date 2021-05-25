import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { System } from '@api/models/systems.model';

// Declare D3 & Sankey library
declare var d3: any;
import * as d3Sankey from 'd3-sankey';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.css']
})
export class SystemsComponent implements OnInit {

  row: Object = <any>{};
  filteredTable: boolean = false;
  filterTitle: string = '';
  interfaces: any[] = [];

  vizData: any[] = [];
  vizLabel: string = 'Total Active Systems'
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Systems Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'SystemTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Systems_SubSystems',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.sysUrl
  });

  // Systems Table Columns
  columnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'orgName',
    title: 'Responsible Org',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'FedContractorLoc',
    title: 'Federal/Contractor',
    sortable: true,
    visible: false
  }, {
    field: 'FIPS_Impact_Level',
    title: 'FIPS Impact Level',
    sortable: true,
    visible: false
  }, {
    field: 'ATODate',
    title: 'ATO Date',
    sortable: true,
    visible: false,
    formatter: this.sharedService.dateFormatter,
    searchable: false
  }, {
    field: 'ATOType',
    title: 'ATO Type',
    sortable: true,
    visible: false
  }, {
    field: 'RenewalDate',
    title: 'Renewal Date',
    sortable: true,
    formatter: this.sharedService.dateFormatter,
    searchable: false
  }, {
    field: 'ComplFISMA',
    title: 'Complete Assessment For Current FY',
    sortable: true,
    visible: false
  }, {
    field: 'PII',
    title: 'PII',
    sortable: true,
    visible: false
  }, {
    field: 'CloudYN',
    title: 'Cloud Hosted?',
    sortable: true
  }, {
    field: 'CSP',
    title: 'Cloud Server Provider',
    sortable: true
  }, {
    field: 'ServiceType',
    title: 'Type of Service',
    sortable: true
  }, {
    field: 'SharedService',
    title: "Gov't-Wide Shared Service",
    sortable: true
  }, {
    field: 'SystemLevel',
    title: 'System Level',
    sortable: true
  }, {
    field: 'FISMASystemIdentifier',
    title: 'FISMA System Identifier',
    sortable: true,
    visible: false
  }, {
    field: 'SubSystem_Tag',
    title: 'SubSystem Identifier Tag',
    sortable: true,
    visible: false
  }, {
    field: 'RelatedArtifacts',
    title: 'Related Artifacts',
    sortable: false,
    visible: false,
    formatter: this.sharedService.relArtifactsFormatter,
    searchable: false
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true,
    visible: false
  }];

  // Inactive Column Defs
  inactiveColumnDefs: any[] = [{
    field: 'Name',
    title: 'System Name',
    sortable: true
  }, {
    field: 'orgName',
    title: 'Responsible Org',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'FedContractorLoc',
    title: 'Federal/Contractor',
    sortable: true,
    visible: false
  }, {
    field: 'FIPS_Impact_Level',
    title: 'FIPS Impact Level',
    sortable: true,
    visible: false
  }, {
    field: 'ATODate',
    title: 'ATO Date',
    sortable: true,
    visible: false,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'ATOType',
    title: 'ATO Type',
    sortable: true,
    visible: false
  }, {
    field: 'RenewalDate',
    title: 'Renewal Date',
    sortable: true,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'ComplFISMA',
    title: 'Complete Assessment For Current FY',
    sortable: true,
    visible: false
  }, {
    field: 'PII',
    title: 'PII',
    sortable: true,
    visible: false
  }, {
    field: 'CloudYN',
    title: 'Cloud Hosted?',
    sortable: true,
    visible: false
  }, {
    field: 'CSP',
    title: 'Cloud Server Provider',
    sortable: true,
    visible: false
  }, {
    field: 'ServiceType',
    title: 'Type of Service',
    sortable: true
  }, {
    field: 'SharedService',
    title: "Gov't-Wide Shared Service",
    sortable: true
  }, {
    field: 'SystemLevel',
    title: 'System Level',
    sortable: true
  }, {
    field: 'FISMASystemIdentifier',
    title: 'FISMA System Identifier',
    sortable: true,
    visible: false
  }, {
    field: 'SubSystem_Tag',
    title: 'SubSystem Identifier Tag',
    sortable: true,
    visible: false
  }, {
    field: 'RelatedArtifacts',
    title: 'Related Artifacts',
    sortable: false,
    visible: false,
    formatter: this.sharedService.relArtifactsFormatter
  }, {
    field: 'InactiveDate',
    title: 'Inactive Date',
    sortable: true,
    formatter: this.sharedService.dateFormatter
  }, {
    field: 'Status',
    title: 'Status',
    sortable: true
  }];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    $('#systemTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Filter to only active systems
    $(document).ready(
      $('#systemTable').bootstrapTable('filterBy', { Status: 'Active' })
    );

    // Method to handle click events on the Systems table
    $(document).ready(
      $('#systemTable').on('click-row.bs.table', function (e, row) {
        this.tableService.systemsTableClick(row);
        // this.getInterfaceData(row.ID);

        // Change URL to include ID
        var normalizedURL = this.sharedService.coreURL(this.router.url);
        this.location.replaceState(`${normalizedURL}/${row.ID}`);
      }.bind(this)
      ));

  // Get System data for visuals
  this.apiService.getSystems().subscribe((data: any[]) => {
    // Get counts by SSO
    var counts = data.reduce((p, c) => {
      var name = c.orgName;
      if (!p.hasOwnProperty(name) && c.Status == 'Active') {
        p[name] = 0;
      }
      // Only count if Status is Active
      if (c.Status == 'Active') p[name]++;
      return p;
    }, {});

    // Resolve the counts into an object and sort by value
    this.vizData = Object.keys(counts).map(k => {
      return { name: k, value: counts[k] };
    })
      .sort(function (a, b) {
        return b.value - a.value;
      });

    // console.log(this.vizData);  // Debug
  });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe(params => {
      var detailSysID = params['sysID'];
      if (detailSysID) {
        this.apiService.getOneSys(detailSysID).subscribe((data: any[]) => {
          this.tableService.systemsTableClick(data[0]);
          // this.getInterfaceData(row.ID);
        });
      };
    });

  }

  // Update table from filter buttons
  changeFilter(field: string, term: string) {
    this.filteredTable = true;  // Filters are on, expose main table button
    var filter = {};
    filter[field] = term;
    var title = '';
    var activeColDef = this.columnDefs;

    // Hide visualization when on alternative filters
    $('#sysViz').collapse('hide');

    $('#systemTable').bootstrapTable('filterBy', filter);
    switch (field) {
      case 'CloudYN':
        title = 'Cloud Enabled GSA';
        break;
      case 'Status':
        title = term + ' GSA';
        activeColDef = this.inactiveColumnDefs;
        break;
    };
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: activeColDef,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(`GSA_${title.replace(' ', '_')}_Systems`)
      }
    });
    this.filterTitle = title;
  }

  backToMainSys() {
    this.filteredTable = false;  // Hide main button

    $('#sysViz').collapse('show');

    // Remove filters and back to default
    $('#systemTable').bootstrapTable('filterBy', { Status: 'Active' });
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Systems_SubSystems')
      }
    });
  }

  onSelect(chartData): void {
    this.filteredTable = true;  // Filters are on, expose main table button
    this.filterTitle = chartData.name;

    // Filter by OrgName clicked on visualization
    $('#systemTable').bootstrapTable('filterBy', {
      Status: ['Active'],
      orgName: chartData.name
    });
    $('#systemTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Systems_SubSystems-' + chartData.name)
      }
    });
  }

//   private getInterfaceData(sysID: number) {
//     this.apiService.getOneDataFlow(sysID).subscribe((data: any[]) => {
//       this.interfaces = data;
//       this.modalService.updateDetails(this.interfaces, 'data-flow');
//       if (this.interfaces.length) this.createDataFlowChart(sysID);  // If there is interface data, create the flow chart
//     });
//   }

//   private createDataFlowChart(sysID: number) {
//     // console.log(sysID, this.interfaces);  // Debug

//     var CONTAINER_ID = '#dataFlowChart',
//       SVG_ID = 'dataflowSVG',
//       units = "Connections",

//       // Set the dimensions and margins of the graph
//       margin = { top: 20, right: 20, bottom: 20, left: 20 },
//       width = 960,
//       height = 500,
//       nodeWidth = 36,
//       nodePadding = 40;

//     if (document.getElementById(SVG_ID)) {
//       return false;
//     };

//     // Make sure element is empty first
//     d3.select(CONTAINER_ID + "> svg").remove();

//     // Append the svg object to the body of the page
//     var svg = d3.select(CONTAINER_ID).append("svg")
//       .attr('width', width)
//       .attr('height', height);

//     var g = svg.append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

//     // Format variables
//     var formatNumber = d3.format(",.0f"),    // zero decimal places
//       format = function (d) { return formatNumber(d) + " " + units; },
//       color = d3.scaleOrdinal()
//         .range(['#9dc6d8', '#00b3ca', '#7dd0b6', '#1d4e89',
//           '#d2b29b', '#e38690', '#f69256', '#ead98b', '#965251',
//           '#c6cccc', '#e5dfef', '#fbdce0', '#cbefe7', '#fffdce',
//           '#d7ffdd',
//         ]);

//     // Set the sankey diagram properties
//     var sankey = d3Sankey.sankey()
//       .nodeWidth(nodeWidth)
//       .nodePadding(nodePadding)
//       .size([width - margin.left - margin.right,
//       height - margin.top - margin.bottom])
//       .nodeId(function (d: any) {
//         return d.name;
//       });

//     var link = g.append("g")
//       .attr("class", "link")
//       .selectAll("path");

//     var node = g.append("g")
//       .attr("class", "node")
//       .selectAll("g");

//     // load the data
//     //set up graph in same style as original example but empty
//     var graph = {
//       "nodes": [],
//       "links": []
//     };

//     this.interfaces.forEach(function (d) {
//       graph.nodes.push({
//         "name": d.srcApp,
//         "id": d.srcAppID
//       });
//       graph.nodes.push({
//         "name": d.destApp,
//         "id": d.destAppID
//       });
//       graph.links.push({
//         "source": d.srcApp,
//         "target": d.destApp,
//         "sourceId": d.srcAppID,
//         "targetId": d.destAppID,
//         "value": 1
//       });
//     });

//     // return only the distinct / unique nodes
//     graph.nodes = Array.from(new Set(graph.nodes.map(node => node.name)))
//       .map(name => {
//         return graph.nodes.find(node => node.name === name)
//       });

//     // console.log("graph: ", graph);  // Debug

//     sankey(graph);

//     // Add in the links
//     link = link.data(graph.links)
//       .enter().append("path")
//       .attr("d", d3Sankey.sankeyLinkHorizontal())
//       .style("fill", "none")
//       // Change path color by target
//       .style("stroke", function (d: any) {
//         return d.color = color(d.targetId);
//       })
//       .style("stroke-opacity", 0.7)
//       // Path width is default or width if value is valid
//       .style("stroke-width", function (d: any) {
//         return Math.max(15, d.width);
//       });

//     // Add the link titles
//     link.append("title")
//       .text(function (d: any) {
//         return d.source.name + " → " +
//           d.target.name + "\n" + format(d.value)
//       });

//     // Add in the nodes
//     node = node.data(graph.nodes)
//       .enter().append("g")
//       .on("click", function (d: any) {
//         //Open new modal when selecting app on interface graphic
//         $('#sysDetail').modal('hide');

//         // Route to new app detail
//         window.location.href = `#/systems/${d.id}`;
//         window.location.reload();
//       }.bind(this));

//     // add the rectangles for the nodes
//     node.append("rect")
//       .attr("x", function (d) { return d.x0; }) //Use original sankey defined positions
//       .attr("y", function (d) { return d.y0 - (Math.max(30, d.height) / 2); }) //Use force defined positions
//       .attr("height", function (d) { return Math.max(30, d.height); })
//       .attr("width", function (d) { return d.x1 - d.x0; })
//       .style("fill", function (d) { return color(d.id); })
//       .style("opacity", 0.5)
//       .style("stroke", "white");

//     // add in the title for the nodes
//     node.append("text")
//       .attr("x", function (d) { return d.x0 - 6; })
//       .attr("y", function (d) { return d.y0 + ((d.y1 - d.y0) / 2); })
//       .attr("dy", "0.35em")
//       .attr("text-anchor", "end")
//       .text(function (d) { return d.name; })
//       .filter(function (d) { return d.x0 < width / 2; })
//       .attr("x", function (d) { return d.x1 + 6; })
//       .attr("text-anchor", "start");
//   }

}
