import { Component, OnInit } from '@angular/core';

import { SharedService } from '../../services/shared/shared.service';

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

  constructor() { }


  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
    this.createCapModel();
  }

  // Create Capability Model Graph
  private createCapModel() {
    this.sharedService.getCapabilities().subscribe((data: any[])=>{
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
            parent: cap.Parent,
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
              parent: firstLevelCap,
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
                parent: firstLevelCap,
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
                secondLevelCap.children.push({
                  identity: cap.ID,
                  name: cap.Name,
                  description: cap.Description,
                  referenceNum: cap.ReferenceNum,
                  parent: firstLevelCap,
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
                  secondLevelCap.children.push({
                    identity: cap.ID,
                    name: cap.Name,
                    description: cap.Description,
                    referenceNum: cap.ReferenceNum,
                    parent: firstLevelCap,
                    children: []
                  });
                }
              });
            });

          });
        });
      });

      console.log("CapTree: ", this.capTree);  // Debug
    });
  }

}
