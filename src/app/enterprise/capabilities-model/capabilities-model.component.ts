import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ModalsService } from '../../services/modals/modals.service';
import { SharedService } from '../../services/shared/shared.service';

// Declare D3 library
declare var d3: any;

// Declare jQuery symbol
declare var $: any;

interface CapTree {
  identity: number;
  name: string;
  description: string;
  referenceNum: string;
  children: Array<any>;
}

@Component({
  selector: 'capabilities-model',
  templateUrl: './capabilities-model.component.html',
  styleUrls: ['./capabilities-model.component.css']
})
export class CapabilitiesModelComponent implements OnInit {

  @ViewChild('busCapGraph') public graphContainer: ElementRef;
  private caps: any[] = [];
  private root: any = {};
  private rootCap: string = 'Manage GSA';
  private capTree: any = {};
  public highlightColor: string = '#ff4136';

  private treemap: any;
  private vis: any;

  public searchKey: string;
  private finalSearchPath;

  constructor(
    private sharedService: SharedService,
    private modalService: ModalsService) { }

  ngOnInit(): void {
    // Enable popovers
    $(function () {
      $('[data-toggle="popover"]').popover()
    })

    this.getCapData();
  }

  // Create Capability Model Graph
  private getCapData() {
    this.sharedService.getCapabilities().subscribe((data: any[]) => {
      // console.log("Capabilities: ", data);  // Debug
      this.caps = data;

      // Set Root Node
      this.caps.forEach(cap => {
        if (cap.Name == this.rootCap) {
          this.capTree = {
            identity: cap.ID,
            name: cap.Name,
            description: cap.Description,
            referenceNum: cap.ReferenceNum,
            children: []
          }
        };
      });

      // Set First-Level Children
      this.caps.forEach(cap => {
        if (cap.Parent == this.capTree.name) {
          this.capTree.children.push({
            identity: cap.ID,
            name: cap.Name,
            description: cap.Description,
            referenceNum: cap.ReferenceNum,
            children: []
          });
        }
      });

      // Set Second-Level Children
      this.capTree.children.forEach(firstLevelCap => {

        this.caps.forEach(cap => {
          if (cap.Parent == firstLevelCap.name) {
            firstLevelCap.children.push({
              identity: cap.ID,
              name: cap.Name,
              description: cap.Description,
              referenceNum: cap.ReferenceNum,
              children: []
            });
          }
        });

      });

      // Set Third-Level Children
      this.capTree.children.forEach(firstLevelCap => {
        firstLevelCap.children.forEach(secondLevelCap => {

          this.caps.forEach(cap => {
            if (cap.Parent == secondLevelCap.name) {
              secondLevelCap.children.push({
                identity: cap.ID,
                name: cap.Name,
                description: cap.Description,
                referenceNum: cap.ReferenceNum,
                children: []
              });
            }
          });

        });
      });

      // Set Fourth-Level Children
      this.capTree.children.forEach(firstLevelCap => {
        firstLevelCap.children.forEach(secondLevelCap => {
          secondLevelCap.children.forEach(thirdLevelCap => {

            this.caps.forEach(cap => {
              if (cap.Parent == thirdLevelCap.name) {
                thirdLevelCap.children.push({
                  identity: cap.ID,
                  name: cap.Name,
                  description: cap.Description,
                  referenceNum: cap.ReferenceNum,
                  children: []
                });
              }
            });

          });
        });
      });

      // Set Fifth-Level Children
      this.capTree.children.forEach(firstLevelCap => {
        firstLevelCap.children.forEach(secondLevelCap => {
          secondLevelCap.children.forEach(thirdLevelCap => {
            thirdLevelCap.children.forEach(fourthLevelCap => {

              this.caps.forEach(cap => {
                if (cap.Parent == fourthLevelCap.name) {
                  fourthLevelCap.children.push({
                    identity: cap.ID,
                    name: cap.Name,
                    description: cap.Description,
                    referenceNum: cap.ReferenceNum,
                    children: []
                  });
                }
              });
            });

          });
        });
      });

      // console.log("CapTree: ", this.capTree);  // Debug
      // Create graph after retrieving data and computing tree
      this.createGraph();
    });
  } // End of getCapData

  // Example taken from https://bl.ocks.org/d3noob/1a96af738c89b88723eb63456beb6510
  private createGraph() {
    var margin: any = { top: 20, bottom: 20, left: 120, right: 120 };
    var i: number = 0;

    // Set margins
    const element = this.graphContainer.nativeElement;
    var width = 1750 - element.offsetWidth - margin.left - margin.right;
    var height = 1000 - element.offsetHeight - margin.top - margin.bottom;

    // Set tree mapping object
    this.treemap = d3.tree().size([height, width]);

    // Set SVG container
    this.vis = d3.select(element).append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set root with hierarchy tree
    this.root = d3.hierarchy(this.capTree, function (d) { return d.children; });
    this.root.x0 = height / 2;
    this.root.y0 = 0;
    this.root.descendants().forEach((d, i) => { d.id = i; });  // Set ids for each node

    // Sort Nodes
    this.root.sort(function (a, b) {
      return a.data.referenceNum.localeCompare(b.data.referenceNum);
    });
    // console.log("Root: ", this.root);  // Debug

    // Only show first level children and render
    this.root.children.forEach(this.collapse);
    this.update(this.root);

  }  // End of createGraph

  // Toggle children
  private toggle(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  }

  // Collapse the node and all it's children
  private collapse = (d) => {
    if (d.children) {
      d._children = d.children
      d._children.forEach(this.collapse)
      d.children = null
    }
  }

  private update = (source) => {
    // Save selected node id
    var selectedCap;

    // Transition timing in milliseconds
    var duration = d3.event && d3.event.altKey ? 5000 : 300;

    // Assigns the x and y position for the nodes
    var treeData = this.treemap(this.root);

    // Compute the new tree layout.
    var nodes = treeData.descendants().reverse(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    //// Change static number to expand or contract graph
    nodes.forEach(function (d) { d.y = d.depth * 280 });

    // ****************** Nodes section ***************************

    // Update the nodes
    var node = this.vis.selectAll('g.node')
      .data(nodes, function (d) { return d.id });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
      .attr("class", "node")
      .attr("transform", function () {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })

      // Toggle children on click and re-render
      .on("click", function (d) {
        // console.log("Clicked Node: ", d);  // Debug
        this.toggle(d);
        this.update(d);
      }.bind(this));

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr("class", "node")
      .attr("r", 1e-6)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      })
      .style("stroke", function (d) {
        if (d.selected) {
          return this.highlightColor;
        } else {
          return "steelblue"
        }
      }.bind(this))
      .style("stroke-width", "2.5px");

    // Add labels for the nodes
    nodeEnter.append('text')
      // Adjust x coordinate when at end of tree
      .attr("x", function (d) {
        return d.children || d._children ? -15 : 15;
      })

      // Move labels above circle
      .attr("dy", "0.35em")

      // Anchor text at middle with children and at start without
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })

      // Display node name for text
      .text(function (d) { return d.data.name; })
      .attr("font-size", "0.75rem")
      .attr("fill", function (d) {
        if (d.selected) {
          return this.highlightColor;
        } else {
          return "black"
        }
      }.bind(this))

      // Create white surrounding on text for easier reading over lines
      .clone(true).lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white");

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr("r", 6)
      .style("fill", function (d) {
        if (d._children) {
          return "lightsteelblue";
        } else {
          return "#fff";
        }
      })
      .style("stroke", function (d) {
        if (d.selected) {
          return this.highlightColor;
        } else {
          return "steelblue"
        }
      }.bind(this))
      .attr("cursor", "pointer")

      // Show detail card on hoverover
      .on("mouseover", function (d) {
        d3.select("#capDetail")
          .style("display", "block");  // Show detail card
        d3.select("#capName")
          .text(d.data.name + " (" + d.data.referenceNum + ")");  // Set Name
        d3.select("#capDetailbody")
          .text(d.data.description);  // Set Description

        // console.log("Hovered Node: ", d);  // Debug
        selectedCap = d.data.identity;  // Save selected node id for links
      });

    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr("r", 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style("fill-opacity", 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = this.vis.selectAll('path.link')
      .data(links, function (d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr("d", function (d) {
        var o = { x: source.x0, y: source.y0 }
        return diagonal(o, o)
      })
      .attr("fill", "none")
      .attr("stroke", function (d) {
        if (d.selected) {
          return this.highlightColor;
        } else {
          return "#ccc"
        }
      }.bind(this))
      .attr("stroke-width", "3px");

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(duration)
      .attr("d", function (d) { return diagonal(d, d.parent) })
      .attr("stroke", function (d) {
        if (d.selected) {
          return this.highlightColor;
        } else {
          return "#ccc"
        }
      }.bind(this));

    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function (d) {
        var o = { x: source.x, y: source.y }
        return diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

      var path = `M ${s.y} ${s.x}
                  C ${(s.y + d.y) / 2} ${s.x},
                    ${(s.y + d.y) / 2} ${d.x},
                    ${d.y} ${d.x}`

      return path
    }

    // Detail Pane Controls
    var capDetail = d3.select('#capDetailLink');
    var capClose = d3.select('#capDetailClose');

    // When detail link is clicked
    capDetail.on("click", function () {
      // console.log("Selected Node: ", selectedCap);  // Debug

      // Grab data for selected node
      this.sharedService.getOneCap(selectedCap).subscribe((data: any[]) => {
        var capData = data[0];
        this.modalService.updateDetails(capData, 'capability');
        $('#capabilityDetail').modal('show');

        // Update related apps table in detail modal with clicked capabilities
        $('#capSupportAppsTable').bootstrapTable('refreshOptions', {
          exportOptions: {
            fileName: this.sharedService.fileNameFmt(capData.Name + '-Supporting_Apps')
          },
          url: this.sharedService.internalURLFmt('/api/capabilities/'
            + String(capData.ID) + '/applications')
        })
      });
    }.bind(this));

    // When close window is clicked
    capClose.on("click", function (d) {
      d3.select("#capDetail").style("display", "none");
    });

  }  // End of update

  public search = (event) => {
    // Clear and reset tree between searches
    this.clearSearch();

    // Search when enter is pressed
    if (event.key === "Enter") {
      // console.log("Searching: ", this.searchKey); // Debug

      var term = this.searchKey.toUpperCase();

      // Reset variables
      var paths = [];

      // Search through all children
      this.root.children.forEach(searchChildren, term);

      // If 'paths' is empty, nothing was found
      if (paths.length != 0) {
        this.finalSearchPath = openPaths(paths);

        // console.log("Final Search Paths: ", this.finalSearchPath);  // Debug
        this.update(this.root);
      } else {
        alert(this.searchKey + " not found!");
      }

      function searchChildren(d) {
        d.selected = false;
        var patt = new RegExp("\\b" + this, "i");

        paths.push(d);  // We assume this path is the right one

        if (d.data.name.match(patt) != null) {

          // Avoid duplication
          if (!paths.includes(d)) {
            paths.push(d);
          }

          d.selected = true;
        } else {
          paths.pop()  // Drop path if it's not correct
        }

        if (d.children)
          d.children.forEach(searchChildren, this);
        else if (d._children)
          d._children.forEach(searchChildren, this);

      };

      function openPaths(paths) {
        for (var index = 0; index < paths.length; index++) {
          paths[index].selected = true;

          //if children are hidden: open them, otherwise: don't do anything
          if (paths[index]._children) {
            paths[index].children = paths[index]._children;
            paths[index]._children = null;
          }

          // Include parent if not already in the path
          if (paths[index].parent.data.name != 'Manage GSA' && !paths.includes(paths[index].parent)) {
            paths.push(paths[index].parent);
          }
        }

        return paths;
      };

    }
  }  // End of search

  public clearSearch() {
    // Unselect all that were in the final search path if there was one
    if (this.finalSearchPath) {
      for (var index = 0; index < this.finalSearchPath.length; index++) {
        this.finalSearchPath[index].selected = false;
      }
      this.finalSearchPath = undefined;
    }

    // Only show first level children and render
    this.root.children.forEach(this.collapse);
    this.update(this.root);
  }

}
