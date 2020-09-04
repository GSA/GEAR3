import { Component, OnInit } from '@angular/core';
import * as lodash from "lodash";

import { ApiService } from "@services/apis/api.service";
import { ModalsService } from '@services/modals/modals.service';
import { SharedService } from '@services/shared/shared.service';
import { TableService } from '@services/tables/table.service';

import { Application } from '@api/models/applications.model';

// Declare D3 & Sankey library
declare var d3: any;
import * as d3Sankey from 'd3-sankey';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'apps',
  templateUrl: './apps.component.html',
  styleUrls: ['./apps.component.css']
})
export class AppsComponent implements OnInit {

  row: Object = <any>{};
  filteredTable: boolean = false;
  filterTitle: string = '';
  interfaces: any[] = [];

  vizData: any[] = [];
  vizLabel: string = 'Total Active Applications'
  colorScheme: {} = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(
    private apiService: ApiService,
    private modalService: ModalsService,
    public sharedService: SharedService,
    private tableService: TableService) {
    this.modalService.currentSys.subscribe(row => this.row = row);
  }

  // Apps Table Options
  tableOptions: {} = this.tableService.createTableOptions({
    advancedSearch: true,
    idTable: 'AppsTable',
    classes: "table-hover table-dark clickable-table fixed-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Business_Apps',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.apiService.appUrl
  });

  // Apps Table Columns
  columnDefs: any[] = [{
    field: 'DisplayName',
    title: 'Display Name',
    sortable: true
  }, {
    field: 'Name',
    title: 'Application Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'SSOShort',
    title: 'SSO',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'CUI',
    title: 'CUI',
    sortable: true,
    visible: false
  }, {
    field: 'OwnerShort',
    title: 'Owning Org (Short)',
    sortable: true
  }, {
    field: 'Owner',
    title: 'Owning Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'BusPOC',
    title: 'Business POC',
    sortable: true,
    visible: false
  }, {
    field: 'BusOrg',
    title: 'Business POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'TechPOC',
    title: 'Technical POC',
    sortable: true,
    visible: false
  }, {
    field: 'TechOrg',
    title: 'Technical POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'ParentSystem',
    title: 'Parent System',
    sortable: true,
    formatter: this.sharedService.systemFormatter
  }, {
    field: 'HostingProvider',
    title: 'Hosting Provider',
    sortable: true,
    visible: false
  }, {
    field: 'Cloud',
    title: 'Cloud',
    sortable: true,
    visible: false
  }, {
    field: 'Mobile_App_Indicator',
    title: 'Mobile App?',
    sortable: true,
    visible: false
  },
  // {
  //   field: 'Desktop_Indicator',
  //   title: 'Desktop Indicator',
  //   sortable: true,
  //   visible: false
  // },
  {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true,
    visible: false
  }, {
    field: 'FISMASystem',
    title: 'FISMA System',
    sortable: true,
    visible: false,
    formatter: this.sharedService.systemFormatter
  }, {
    field: 'Investment',
    title: 'Investment Name',
    sortable: true,
    visible: false
  },
  //{
  //   field: 'HelpDesk',
  //   title: 'Help Desk',
  //   sortable: true,
  //   visible: false
  // },
  {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
  }, {
    field: 'Application_or_Website',
    title: 'Application or Website',
    sortable: true,
    visible: false
  }, {
    field: 'Application_Notes',
    title: 'Application Notes',
    sortable: false,
    visible: false
  }];

  // Retired Apps Table Column Definitions
  retiredColumnDefs: any[] = [{
    field: 'DisplayName',
    title: 'Display Name',
    sortable: true
  }, {
    field: 'Name',
    title: 'Application Name',
    sortable: true
  }, {
    field: 'Description',
    title: 'Description',
    sortable: true,
    class: 'text-truncate'
  }, {
    field: 'SSOShort',
    title: 'SSO',
    sortable: true
  }, {
    field: 'SSO',
    title: 'SSO (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'CUI',
    title: 'CUI',
    sortable: true,
    visible: false
  }, {
    field: 'OwnerShort',
    title: 'Owning Org (Short)',
    sortable: true
  }, {
    field: 'Owner',
    title: 'Owning Org (Long)',
    sortable: true,
    visible: false
  }, {
    field: 'BusPOC',
    title: 'Business POC',
    sortable: true,
    visible: false
  }, {
    field: 'BusOrg',
    title: 'Business POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'TechPOC',
    title: 'Technical POC',
    sortable: true,
    visible: false
  }, {
    field: 'TechOrg',
    title: 'Technical POC Org',
    sortable: true,
    visible: false
  }, {
    field: 'System',
    title: 'Parent System',
    sortable: true,
    visible: false,
    formatter: this.sharedService.systemFormatter
  }, {
    field: 'HostingProvider',
    title: 'Hosting Provider',
    sortable: true,
    visible: false
  }, {
    field: 'Cloud',
    title: 'Cloud',
    sortable: true,
    visible: false
  }, {
    field: 'Mobile_App_Indicator',
    title: 'Mobile App?',
    sortable: true,
    visible: false
  },
  // {
  //   field: 'Desktop_Indicator',
  //   title: 'Desktop Indicator',
  //   sortable: true,
  //   visible: false
  // },
  {
    field: 'Status',
    title: 'Status',
    sortable: true
  }, {
    field: 'ProdYear',
    title: 'Production Year',
    sortable: true
  }, {
    field: 'RetiredYear',
    title: 'Retired Year (CY)',
    sortable: true
  }, {
    field: 'FISMASystem',
    title: 'FISMA System',
    sortable: true,
    visible: false,
    formatter: this.sharedService.systemFormatter
  },
  //{
  //   field: 'HelpDesk',
  //   title: 'Help Desk',
  //   sortable: true,
  //   visible: false
  // },
  {
    field: 'OMBUID',
    title: 'Application ID',
    sortable: true,
    visible: false
  }, {
    field: 'Application_or_Website',
    title: 'Application or Website',
    sortable: true,
    visible: false
  }, {
    field: 'Application_Notes',
    title: 'Application Notes',
    sortable: false,
    visible: false
  }];


  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    $('#appsTable').bootstrapTable($.extend(this.tableOptions, {
      columns: this.columnDefs,
      data: [],
    }));

    // Filter by only non-retired
    $(document).ready(
      $('#appsTable').bootstrapTable('filterBy', {
        Status: ['Candidate', 'Pre-Production', 'Production']
      })
    );

    // Method to handle click events on the Applications table
    $(document).ready(
      $('#appsTable').on('click-row.bs.table', function (e, row) {
        this.tableService.appsTableClick(row);
        this.getInterfaceData(row.ID);
      }.bind(this),
      ));


    // Get Investment data for visuals
    this.apiService.getApplications().subscribe((data: any[]) => {
      // Get counts by SSO
      var counts = data.reduce((p, c) => {
        var name = c.SSOShort;
        if (!p.hasOwnProperty(name)) {
          p[name] = 0;
        }
        // Only count if Status is not retiredx
        if (['Candidate', 'Pre-Production', 'Production'].includes(c.Status)) p[name]++;
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

  }


  // Create new application when in GEAR Manager mode
  createApp() {
    var emptyApp = new Application();

    // By default, set new record to active
    emptyApp.Status = 'Pre-Production';
    this.modalService.updateRecordCreation(true);
    this.modalService.updateDetails(emptyApp, 'application');
    this.sharedService.setAppForm();
    $('#appManager').modal('show');
  }

  // Update table, filtering by SSO
  changeFilter(field: string, term: string) {
    this.filteredTable = true;  // SSO filters are on, expose main table button
    var filter = {};
    filter[field] = term;

    // Hide visualization when on alternative filters
    $('#appViz').collapse('hide');

    // Set cloud field to visible if filtering by cloud enabled
    if (field == 'Cloud') {
      var cloudCols = lodash.cloneDeep(this.columnDefs);
      for (let index = 0; index < cloudCols.length; index++) {
        const column = cloudCols[index];
        if (column['field'] == 'Cloud') {
          column['visible'] = true;
        }
      }
      $('#appsTable').bootstrapTable('filterBy', filter);
      $('#appsTable').bootstrapTable('refreshOptions', {
        columns: cloudCols
      });

      this.filterTitle = "Cloud Enabled";
    } else {
      $('#appsTable').bootstrapTable('filterBy', filter);

      if (term === 'Retired') var columnsDef = this.retiredColumnDefs;
      else var columnsDef = this.columnDefs;
      $('#appsTable').bootstrapTable('refreshOptions', { columns: columnsDef });

      this.filterTitle = term;
    }
  }

  backToMainApp() {
    this.filteredTable = false;  // Hide main button
    this.filterTitle = '';

    $('#appViz').collapse('show');

    // Remove filters and back to default
    $('#appsTable').bootstrapTable('filterBy', { Status: ['Candidate', 'Pre-Production', 'Production'] });
    $('#appsTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
    });
  }

  onSelect(chartData): void {
    this.filteredTable = true;  // Filters are on, expose main table button
    this.filterTitle = chartData.name;

    // Filter by SSO clicked on visualization
    $('#appsTable').bootstrapTable('filterBy', {
      Status: ['Candidate', 'Pre-Production', 'Production'],
      SSOShort: chartData.name
    });
    $('#appsTable').bootstrapTable('refreshOptions', {
      exportOptions: {
        fileName: this.sharedService.fileNameFmt('GSA_Business_Apps-' + chartData.name)
      }
    });
  }

  private getInterfaceData(appID: number) {
    this.apiService.getOneDataFlow(appID).subscribe((data: any[]) => {
      this.interfaces = data;
      this.modalService.updateDetails(this.interfaces, 'data-flow');
      if (this.interfaces.length) this.createDataFlowChart(appID);  // If there is interface data, create the flow chart
    });
  }

  private createDataFlowChart(appID: number) {
    // console.log(appID, this.interfaces);  // Debug

    var CONTAINER_ID = '#dataFlowChart',
      SVG_ID = 'dataflowSVG',
      units = "Connections",

      // Set the dimensions and margins of the graph
      margin = { top: 20, right: 20, bottom: 20, left: 20 },
      width = 960,
      height = 500,
      nodeWidth = 36,
      nodePadding = 40;

    if (document.getElementById(SVG_ID)) {
      return false;
    };

    // Append the svg object to the body of the page
    var svg = d3.select(CONTAINER_ID).append("svg")
      .attr('width', width)
      .attr('height', height);

    var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    // Format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
      format = function (d) { return formatNumber(d) + " " + units; },
      color = d3.scaleOrdinal()
        .range(['#9dc6d8', '#00b3ca', '#7dd0b6', '#1d4e89',
          '#d2b29b', '#e38690', '#f69256', '#ead98b', '#965251',
          '#c6cccc', '#e5dfef', '#fbdce0', '#cbefe7', '#fffdce',
          '#d7ffdd',
        ]);

    // Set the sankey diagram properties
    var sankey = d3Sankey.sankey()
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .size([width - margin.left - margin.right,
      height - margin.top - margin.bottom])
      .nodeId(function (d: any) {
        return d.name;
      });

    var link = g.append("g")
      .attr("class", "link")
      .selectAll("path");

    var node = g.append("g")
      .attr("class", "node")
      .selectAll("g");

    // load the data
    //set up graph in same style as original example but empty
    var graph = {
      "nodes": [],
      "links": []
    };

    this.interfaces.forEach(function (d) {
      graph.nodes.push({
        "name": d.srcApp,
        "id": d.srcAppID
      });
      graph.nodes.push({
        "name": d.destApp,
        "id": d.destAppID
      });
      graph.links.push({
        "source": d.srcApp,
        "target": d.destApp,
        "sourceId": d.srcAppID,
        "targetId": d.destAppID,
        "value": 1
      });
    });

    // return only the distinct / unique nodes
    graph.nodes = Array.from(new Set(graph.nodes.map(node => node.name)))
      .map(name => {
        return graph.nodes.find(node => node.name === name)
      });

    // console.log("graph: ", graph);  // Debug

    sankey(graph);

    // Add in the links
    link = link.data(graph.links)
      .enter().append("path")
      .attr("d", d3Sankey.sankeyLinkHorizontal())
      .style("fill", "none")
      // Change path color by target
      .style("stroke", function (d: any) {
        return d.color = color(d.targetId);
      })
      .style("stroke-opacity", 0.7)
      // Path width is default or width if value is valid
      .style("stroke-width", function (d: any) {
        return Math.max(15, d.width);
      });

    // Add the link titles
    link.append("title")
      .text(function (d: any) {
        return d.source.name + " → " +
          d.target.name + "\n" + format(d.value)
      });

    // Add in the nodes
    node = node.data(graph.nodes)
      .enter().append("g");

    // add the rectangles for the nodes
    node.append("rect")
      .attr("x", function (d) { return d.x0; }) //Use original sankey defined positions
      .attr("y", function (d) { return d.y0 - (Math.max(30, d.height) / 2); }) //Use force defined positions
      .attr("height", function (d) { return Math.max(30, d.height); })
      .attr("width", function (d) { return d.x1 - d.x0; })
      .style("fill", function (d) { return color(d.id); })
      .style("opacity", 0.5)
      .style("stroke", "white");

    // add in the title for the nodes
    node.append("text")
      .attr("x", function (d) { return d.x0 - 6; })
      .attr("y", function (d) { return d.y0 + ((d.y1 - d.y0) / 2); })
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(function (d) { return d.name; })
      .filter(function (d) { return d.x0 < width / 2; })
      .attr("x", function (d) { return d.x1 + 6; })
      .attr("text-anchor", "start");
  }

}
