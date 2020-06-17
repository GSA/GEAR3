import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { SharedService } from '../../services/shared/shared.service';

declare var d3: any;

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
export class CapabilitiesModelComponent implements AfterViewInit {

  @ViewChild('busCapGraph') public graphContainer: ElementRef;
  private caps: any[] = [];
  private parentCap: string = 'Manage GSA';
  private capTree: any = {};
  public highlightColor: string = '#ff4136';



  constructor(private sharedService: SharedService) { }

  ngAfterViewInit(): void {
    this.getCapData();
  }
  
  // Create Capability Model Graph
  private getCapData() {
    this.sharedService.getCapabilities().subscribe((data: any[]) => {
      // console.log("Capabilities: ", data);  // Debug
      this.caps = data;

      // Set Root Node
      this.caps.forEach(cap => {
        if (cap.Name == this.parentCap) {
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
            // parent: cap.Parent,
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
              // parent: firstLevelCap,
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
                // parent: secondLevelCap,
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
                  // parent: thirdLevelCap,
                  children: []
                });
              }
            });

          });
        });
      });

      // Set Fifth-Level Children
      // this.capTree.children.forEach(firstLevelCap => {
      //   firstLevelCap.children.forEach(secondLevelCap => {
      //     secondLevelCap.children.forEach(thirdLevelCap => {
      //       thirdLevelCap.children.forEach(fourthLevelCap => {

      //         this.caps.forEach(cap => {
      //           if (cap.Parent == fourthLevelCap.name) {
      //             fourthLevelCap.children.push({
      //               identity: cap.ID,
      //               name: cap.Name,
      //               description: cap.Description,
      //               referenceNum: cap.ReferenceNum,
      //               // parent: fourthLevelCap,
      //               children: []
      //             });
      //           }
      //         });
      //       });

      //     });
      //   });
      // });

      // console.log("CapTree: ", this.capTree);  // Debug
      // Create graph after retrieving data and computing tree
      this.createGraph();
    });
  } // End of getCapData

  createGraph () {
    var margin: any = { top: 20, bottom: 20, left: 120, right: 120 },
        root: any = {},
        i: number = 0;

    // Set margins
    const element = this.graphContainer.nativeElement;
    var width = 1750 - element.offsetWidth - margin.left - margin.right;
    var height = 800 - element.offsetHeight - margin.top - margin.bottom;

    // Set tree mapping object
    var treemap = d3.tree().size([height, width]);

    // Set SVG container
    var vis = d3.select(element).append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set root with hierarchy tree
    root = d3.hierarchy(this.capTree, function(d) { return d.children; });
    root.x0 = height / 2;
    root.y0 = 0;

    // Sort Nodes
    root.sort(function(a, b) {
      return a.data.referenceNum.localeCompare(b.data.referenceNum);
    });
    // console.log("Root: ", root);  // Debug

    // Only show first level children and render
    root.children.forEach(collapse);
    update(root);

    // Toggle children
    function toggle(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    }

    // Collapse the node and all it's children
    function collapse(d) {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

    function update(source) {
      // Transition timing in milliseconds
      var duration = d3.event && d3.event.altKey ? 5000 : 300;

      // Assigns the x and y position for the nodes
      var treeData = treemap(root);
    
      // Compute the new tree layout.
      var nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);
    
      // Normalize for fixed-depth.
      //// Change static number to expand or contract graph
      nodes.forEach(function(d){ d.y = d.depth * 300});
    
      // ****************** Nodes section ***************************
    
      // Update the nodes
      var node = vis.selectAll('g.node')
        .data(nodes, function(d: any) {return d.id || (d.id = ++i); });
    
      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function() {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        // Toggle children on click and re-render
        .on('click', function(d) {
          toggle(d);
          update(d);
        });
        // .on("mouseover", function(d) {
        //   d3.select("#funcdetail").style("display", "block");
        //   d3.select("#funcdetailheader").text = "";
        //   d3.select("#funcdetailbody").text = "";
        //   $scope.selectedcap = d.identity;
        //   var b = d3.select("#funcdetailbody")
        //     .text("");
        //   var a = d3.select("#funcname")
        //     .text("");
        //   var info2 = b.append('text')
        //     .classed('info2', true)
        //     .text(d.description);
        //   var a = d3.select("#funcname");

        //   var info = a.append('span')
        //     .classed('info', true)
        //     .text(d.name + " (" + d.referenceNum + ")");
        // });
    
      // Add Circle for the nodes
      nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function(d: any) {
            return d._children ? "lightsteelblue" : "#fff";
        })
        .style("stroke", "steelblue")
        .style("stroke-width", "2.5px");
    
      // Add labels for the nodes
      nodeEnter.append('text')
        // Adjust x coordinate when at end of tree
        .attr("x", function(d) {
          return d.children || d._children ? 0 : 15;
        })

        // Move labels above circle
        .attr("dy", function(d) {
          return d.children || d._children ? "-1em" :
            "0.35em";
        })

        // Add an id to later select node during search
        .attr("id", function(d) {
          return "textnode-" + d.data.identity;
        })

        // Anchor text at middle with children and at start without
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "middle" : "start";
        })

        // Display node name for text
        .text(function(d) { return d.data.name; })
        .attr("font-size", '0.8rem');

      // UPDATE
      var nodeUpdate = nodeEnter.merge(node);
    
      // Transition to the proper position for the node
      nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) { 
            return "translate(" + d.y + "," + d.x + ")";
         });
    
      // Update the node attributes and style
      nodeUpdate.select('circle.node')
        .attr('r', 6)
        .style("fill", function(d: any) {
          if (d.selected) {
            return "#ff4136"; // this.highlightColor;
          } else if (d._children) {
            return "lightsteelblue";
          } else {
            return "#fff";
          }
        })
        .attr('cursor', 'pointer');
        // .style("stroke", function(d: any) {
        //   if (d.selected) {
        //     return "#ff4136"; // this.highlightColor;
        //   }
        // });

      // nodeUpdate.select("text")
      //   .style("fill-opacity", 1)
      //   .style("fill", function(d: any) {
      //     if (d.selected) {
      //       return "#ff4136"; // this.highlightColor;
      //     }
      //   });
    
    
      // Remove any exiting nodes
      var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();
    
      // On exit reduce the node circles size to 0
      nodeExit.select('circle')
        .attr('r', 1e-6);
    
      // On exit reduce the opacity of text labels
      nodeExit.select('text')
        .style('fill-opacity', 1e-6);
    
      // ****************** links section ***************************
    
      // Update the links...
      var link = vis.selectAll('path.link')
        .data(links, function(d: any) { return d.id; });
    
      // Enter any new links at the parent's previous position.
      var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
          var o = {x: source.x0, y: source.y0}
          return diagonal(o, o)
        })
        .attr('fill', 'none')
        .attr('stroke', '#CCC')
        .attr('stroke-width', '3px');
    
      // UPDATE
      var linkUpdate = linkEnter.merge(link);
    
      // Transition back to the parent element position
      linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return diagonal(d, d.parent) })
        // .style("stroke", function(d) {
        //   if (d.target.selected) {
        //     return this.highlightColor;
        //   }
        // });
    
      // Remove any exiting links
      var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
          var o = {x: source.x, y: source.y}
          return diagonal(o, o)
        })
        .remove();
    
      // Store the old positions for transition.
      nodes.forEach(function(d: any){
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

      // Detail Pane
      // var capdetail = d3.select('#funcdet');
      // var capclose = d3.select('#funcclose');

      // capdetail.on("click", function() {
      //   var cappath = '/#!/capabilities/' + $scope
      //   .selectedcap;
      //   $window.open(cappath, "_blank");
      // });

      // capclose.on("click", function(d) {
      //   d3.select("#funcdetail").style("display", "none");
      // });
    }  // End of update
  }  // End of createGraph

}
