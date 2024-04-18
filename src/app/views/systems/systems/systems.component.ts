import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@services/apis/api.service';
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';
import { Title } from '@angular/platform-browser';

import { System } from '@api/models/systems.model';

// Declare D3 & Sankey library
declare var d3: any;
import * as d3Sankey from 'd3-sankey';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'systems',
  templateUrl: './systems.component.html',
  styleUrls: ['./systems.component.css'],
})
export class SystemsComponent implements OnInit {
  row: Object = <any>{};
  filteredTable: boolean = false;
  filterTitle: string = '';
  interfaces: any[] = [];
  cloudTable: boolean = false;
  inactiveTable: boolean = false;
  pendingTable: boolean = false;

  vizData: any[] = [];
  vizLabel: string = 'Total Active Systems';
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
  };

  constructor(
    private apiService: ApiService,
    private location: Location,
    private modalService: ModalsService,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    private tableService: TableService,
    private titleService: Title
  ) {
    this.modalService.currentSys.subscribe((row) => (this.row = row));
  }

  //active table export ignore column indices
  activeExportIgnoreColumn = [2];
  //inactive table export ignore column indices
  inactiveExportIgnoreColumn = [2];
  
  // Systems Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'SystemTable',
    classes: 'table-hover table-dark clickable-table',
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Systems_SubSystems',
    exportIgnoreColumn: this.activeExportIgnoreColumn,
    headerStyle: 'bg-danger',
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.sysUrl,
  });

  // Systems Table Columns
  columnDefs: any[] = [
    {
      field: 'ID',
      title: 'ID',
      sortable: true,
      visible: false,
    },
    {
      field: 'DisplayName',
      title: 'Alias/Acronym',
      sortable: true,
    },
    {
      field: 'Name',
      title: 'System Name',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: true,
      class: 'text-wrap',
      formatter: (value: any, row: any): string => {
        return value && value.length > 200 ? value.substring(0, 200) + "..." : value;
      }
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: false,
      switchable: false,
      forceExport: true
    },
    {
      field: 'SystemLevel',
      title: 'System Level',
      sortable: true,
    },
    {
      field: 'Status',
      title: 'Status',
      sortable: true,
    },
    {
      field: 'RespOrg',
      title: 'Responsible Org',
      sortable: true,
    },
    {
      field: 'BusOrgSymbolAndName',
      title: 'SSO/CXO',
      sortable: true,
    },
    {
      field: 'BusOrg',
      title: 'Business Org',
      sortable: true,
    },
    {
      field: 'ParentName',
      title: 'Parent System',
      sortable: true,
      visible: false,
    },
    {
      field: 'CSP',
      title: 'Hosting Provider',
      sortable: true,
      visible: false,
    },
    {
      field: 'CloudYN',
      title: 'Cloud Hosted?',
      sortable: true,
      visible: false,
    },
    {
      field: 'AO',
      title: 'Authorizing Official',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'SO',
      title: 'System Owner',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'BusPOC',
      title: 'Business POC',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'TechPOC',
      title: 'Technical POC',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
  ];

  // Inactive Column Defs
  inactiveColumnDefs: any[] = [
    {
      field: 'Name',
      title: 'System Name',
      sortable: true,
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: true,
      class: 'text-wrap',
      formatter: (value: any, row: any): string => {
        return value && value.length > 200 ? value.substring(0, 200) + "..." : value;
      }
    },
    {
      field: 'Description',
      title: 'Description',
      sortable: true,
      visible: false,
      switchable: false,
      forceExport: true
    },
    {
      field: 'SystemLevel',
      title: 'System Level',
      sortable: true,
    },
    {
      field: 'Status',
      title: 'Status',
      sortable: true,
    },
    {
      field: 'RespOrg',
      title: 'Responsible Org',
      sortable: true,
    },
    {
      field: 'BusOrg',
      title: 'Business Org',
      sortable: true,
    },
    {
      field: 'CSP',
      title: 'Cloud Server Provider',
      sortable: true,
      visible: false,
    },
    {
      field: 'CloudYN',
      title: 'Cloud Hosted?',
      sortable: true,
      visible: false,
    },
    {
      field: 'AO',
      title: 'Authorizing Official',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'SO',
      title: 'System Owner',
      sortable: true,
      visible: false,
      formatter: this.sharedService.pocStringNameFormatter,
    },
    {
      field: 'InactiveDate',
      title: 'Inactive Date',
      sortable: true,
      formatter: this.sharedService.dateFormatter,
    },
  ];

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover();
    });

    // Set JWT when logged into GEAR Manager when returning from secureAuth
    this.sharedService.setJWTonLogIn();

    $('#systemTable').bootstrapTable(
      $.extend(this.tableOptions, {
        columns: this.columnDefs,
        data: [],
      })
    );

    const self = this;
    $(document).ready(() => {
      // Filter to only active systems
      $('#systemTable').bootstrapTable('filterBy', {
        Status: 'Active',
        BusApp: 'Yes',
      });

      // Method to handle click events on the Systems table
      $('#systemTable').on(
        'click-row.bs.table',
        function (e, row) {
          this.tableService.systemsTableClick(row);
          // this.getInterfaceData(row.ID);
        }.bind(this)
      );

      //Enable table sticky header
      self.sharedService.enableStickyHeader("systemTable");
    });

    // Get System data for visuals
    this.apiService.getSystems().subscribe((data: any[]) => {
      // Get counts by SSO
      var counts = data.reduce((p, c) => {
        var name = c.BusOrgSymbolAndName;
        if (
          !p.hasOwnProperty(name) &&
          c.Status == 'Active' &&
          c.BusApp == 'Yes'
        ) {
          p[name] = 0;
        }
        // Only count if Status is Active
        if (c.Status == 'Active' && c.BusApp == 'Yes') p[name]++;
        return p;
      }, {});

      // Resolve the counts into an object and sort by value
      this.vizData = Object.keys(counts)
        .map((k) => {
          return { name: k, value: counts[k] };
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      // console.log(this.vizData);  // Debug
    });

    // Method to open details modal when referenced directly via URL
    this.route.params.subscribe((params) => {
      var detailSysID = params['sysID'];
      if (detailSysID) {
        this.titleService.setTitle(
          `${this.titleService.getTitle()} - ${detailSysID}`
        );
        this.apiService.getOneSys(detailSysID).subscribe((data: any[]) => {
          this.tableService.systemsTableClick(data[0]);
          // this.getInterfaceData(row.ID);
        });
      }
    });
  }

  getAriaLabel(data: { name: string, value: number }[]): string {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    if (data.length === 1) {
      return `Pie chart representing ${total} total active systems, all of which are ${data[0].value} ${data[0].name}`;
    } else {
      const labels = data.map(item => `${Math.round((item.value / total) * 100)}% are ${item.name}`).join(', ');
      return `Pie chart representing ${total} total active systems, of which ${labels}}`;
    }
  }

  // Update table from filter buttons if only filtering ONE column. Not currently used in business systems report.
  changeFilter(field: string, term: string) {
    this.sharedService.disableStickyHeader("systemTable");
    this.filteredTable = true; // Filters are on, expose main table button
    var filter = {};
    filter[field] = term;
    var title = '';
    var activeColDef = this.columnDefs;
    var exportIgnoreColumn = this.activeExportIgnoreColumn;

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
        exportIgnoreColumn = this.inactiveExportIgnoreColumn;
        break;
    }
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: activeColDef,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          `GSA_${title.replace(' ', '_')}_Systems`
        ),
        ignoreColumn: exportIgnoreColumn
      },
    });
    this.filterTitle = title;
    this.sharedService.enableStickyHeader("systemTable");
  }

  //The following is adapted from fisma.component.ts to filter on multiple columns of data rather than one
  // Update table to Cloud Business Systems
  showCloud() {
    $('#systemTable').floatThead('destroy');
    this.filteredTable = true; // Expose main table button after "Cloud Enabled" button is pressed
    this.filterTitle = 'Cloud GSA';

    // Hide visualization when on alternative filters
    $('#sysViz').collapse('hide');

    // Change columns, filename, and url
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Cloud_Business_Systems'),
        ignoreColumn:this.activeExportIgnoreColumn
      },
    });

    // Filter to only "Cloud" Business Systems/Subsystems
    $('#systemTable').bootstrapTable('filterBy', {
      Status: ['Active'],
      BusApp: 'Yes',
      CloudYN: 'Yes',
    });
    this.sharedService.enableStickyHeader("systemTable");
  }

  // Update table to Inactive Business Systems
  showInactive() {
    this.sharedService.disableStickyHeader("systemTable");
    this.filteredTable = true; // Expose main table button after "Inactive" button is pressed
    this.filterTitle = 'Inactive GSA';

    // Hide visualization when on alternative filters
    $('#sysViz').collapse('hide');

    // Change columns, filename, and url
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Inactive_Business_Systems'
        ),
        ignoreColumn: this.inactiveExportIgnoreColumn
      },
    });

    // Filter to only "Inactive" Business Systems/Subsystems
    $('#systemTable').bootstrapTable('filterBy', {
      Status: ['Inactive'],
      BusApp: 'Yes',
    });
    this.sharedService.enableStickyHeader("systemTable");
  }

  // Update table to Pending Business Systems
  showPending() {
    this.sharedService.disableStickyHeader("systemTable");
    this.filteredTable = true; // Expose main table button after "Pending" button is pressed
    this.filterTitle = 'Pending GSA';

    // Hide visualization when on alternative filters
    $('#sysViz').collapse('hide');

    // Change columns, filename, and url
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Pending_Business_Systems'
        ),
        ignoreColumn: this.activeExportIgnoreColumn
      },
    });

    // Filter to only "Pending" Business Systems/Subsystems
    $('#systemTable').bootstrapTable('filterBy', {
      Status: ['Pending'], //,
      //Commenting out BusApp: 'Yes' since pending systems need to be reviewed by EA and Security of whether they are a business system.
      //BusApp: 'Yes'
    });
    this.sharedService.enableStickyHeader("systemTable");
  }
  //The preceding code is adapted from fisma.component.ts to filter on multiple columns of data rather than one

  backToMainSys() {
    this.sharedService.disableStickyHeader("systemTable");
    this.filteredTable = false; // Hide main button

    $('#sysViz').collapse('show');

    // Remove filters and back to default
    $('#systemTable').bootstrapTable('filterBy', {
      Status: 'Active',
      BusApp: 'Yes',
    });
    $('#systemTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Systems_SubSystems'),
        ignoreColumn:this.activeExportIgnoreColumn
      },
    });
    this.sharedService.enableStickyHeader("systemTable");
  }

  onSelect(chartData): void {
    this.sharedService.disableStickyHeader("systemTable");
    this.filteredTable = true; // Filters are on, expose main table button
    this.filterTitle = chartData.name;

    // Filter by RespOrg clicked on visualization
    $('#systemTable').bootstrapTable('filterBy', {
      Status: ['Active'],
      BusApp: 'Yes',
      BusOrgSymbolAndName: chartData.name,
    });
    $('#systemTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt(
          'GSA_Systems_SubSystems-' + chartData.name
        ),
      },
    });
    this.sharedService.enableStickyHeader("systemTable");
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
