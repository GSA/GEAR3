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
    classes: "table-hover table-dark clickable-table",
    showColumns: true,
    showExport: true,
    exportFileName: 'GSA_Business_Apps',
    headerStyle: "bg-danger",
    pagination: true,
    search: true,
    sortName: 'Name',
    sortOrder: 'asc',
    showToggle: true,
    url: this.sharedService.internalURLFmt('/api/applications')
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

      this.filterTitle = "Cloud Enabled ";
    } else {
      $('#appsTable').bootstrapTable('filterBy', filter);

      if (term === 'Retired') var columnsDef = this.retiredColumnDefs;
      else var columnsDef = this.columnDefs;
      $('#appsTable').bootstrapTable('refreshOptions', { columns: columnsDef });

      this.filterTitle = `${term} `;
    }
  }

  backToMainApp() {
    this.filteredTable = false;  // Hide main button
    this.filterTitle = '';

    // Remove filters and back to default
    $('#appsTable').bootstrapTable('filterBy', { Status: ['Candidate', 'Pre-Production', 'Production'] });
    $('#appsTable').bootstrapTable('refreshOptions', {
      columns: this.columnDefs,
    });
  }

  private getInterfaceData(appID: number) {
    this.apiService.getOneDataFlow(appID).subscribe((data: any[]) => {
      this.interfaces = data;
      this.createDataFlowChart(appID, this.interfaces);
    });
  }

  private createDataFlowChart(appID: number, interfaces: any[]) {
    console.log(appID, interfaces);  // Debug

    var CONTAINER_ID = '#dataFlowChart',
      SVG_ID = 'dataflowSVG',
      units = "Connections",

      // set the dimensions and margins of the graph
      margin = { top: 10, right: 10, bottom: 10, left: 10 },
      width = 700 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom,
      nodeWidth = 36,
      nodePadding = 40;

    if (document.getElementById(SVG_ID)) {
      return false;
    };

    // load the data
    //set up graph in same style as original example but empty
    var graph = {
      "nodes": [],
      "links": []
    },
      node_k = [],
      link_k = [];

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
        "targetId": d.destAppID
      });
    });

    // return only the distinct / unique nodes
    graph.nodes = Array.from(new Set(graph.nodes.map(node => node.name)))
      .map(name => {
        return graph.nodes.find(node => node.name === name)
      });

    // graph.links.forEach(link => {
    //   if (!node_k.includes(link.sourceId)){
    //     if (!node_k.includes(link.targetId)) link_k.push(link);
    //     node_k.push(link.sourceId);
    //   }
    // });


    // graph.links = link_k;

    console.log("graph: ", graph);  // Debug

    // format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
      format = function (d) { return formatNumber(d) + " " + units; },
      color = d3.scaleOrdinal()
        .range(['#9dc6d8', '#00b3ca', '#7dd0b6', '#1d4e89',
          '#d2b29b', '#e38690', '#f69256', '#ead98b', '#965251',
          '#c6cccc', '#e5dfef', '#fbdce0', '#cbefe7', '#fffdce',
          '#d7ffdd',
        ]);

    // append the svg object to the body of the page
    var svg = d3.select(CONTAINER_ID)//.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      // .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // Set the sankey diagram properties
    var sankey = d3Sankey.sankey()
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .size([width, height])
      .nodeId(function (d) {
        return d.name;
      });

    sankey(graph);

    // add in the links
    var link = svg.append("g")//.selectAll(".link")
      .data(graph.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d3Sankey.sankeyLinkHorizontal())
      .attr("stroke-width", function (d: any) { return Math.max(1, d.width); })
      // .sort(function (a, b) { return b.dy - a.dy; });
      .selectAll("path");

    // add the link titles
    link.append("title")
      .text(function (d) {
        return d.source.name + " → " +
          d.target.name + "\n" + format(d.value);
      });

    // add in the nodes
    var node = svg.append("g")//.selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node");

    // add the rectangles for the nodes
    node.append("rect")
      .attr("x", function (d) { return d.x0; }) //Use original sankey defined positions
      .attr("y", function (d) { return d.y0; }) //Use force defined positions
      .attr("height", function (d) { return d.y1 - d.y0; })
      .attr("width", function (d) { return d.x1 - d.x0; })
      .style("fill", function (d) { return d.partOfCycle ? "red" : color(d.depth); })
      .style("fill", function (d) { return color(d.depth); })
      .style("opacity", 0.5)
      .style("stroke", "white")
      .on("mouseover", function (d) {
        d3.select(this).style("opacity", 1);
        let thisName = d.name;
        d3.selectAll("path")
          .style("opacity", function (l) {
            return l.source.name == thisName || l.target.name == thisName ? 1 : 0.3;
          })
      })
      .on("mouseout", function (d) {
        d3.selectAll("rect").style("opacity", 0.5);
        d3.selectAll("path").style("opacity", 0.7);
      })

    // add in the title for the nodes
    node.append("text")
      .attr("x", function (d) { return d.x0 - 6; })
      .attr("y", function (d) { return d.y0 + ((d.y1 - d.y0) / 2); })
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(function (d) { return d.name; })
      .filter(function (d) { return d.x0 < width / 2; })
      .attr("x", function (d) { return d.x1 + 6; })
      .attr("text-anchor", "start")

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this)
        .attr("transform",
          "translate("
          + d.x + ","
          + (d.y = Math.max(
            0, Math.min(height - d.dy, d3.event.y))
          ) + ")");
      sankey.relayout();
      // link.attr("d", path);
    }

    function mouseclick(d) {
      if (d3.event.defaultPrevented) return; // dragged
      var appid = d.id;

      // Grab data for selected node
      this.apiService.getOneApp(appid).subscribe((data: any[]) => {
        var appData = data[0];
        this.tableService.appsTableClick(appData);
      });
    };

  }

}
