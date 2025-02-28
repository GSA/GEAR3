import { Component } from '@angular/core';
import { SidebarButtonChild } from '@common/sidebar-classes';

@Component({
  selector: 'app-sidebar-v2',
  templateUrl: './sidebar-v2.component.html',
  styleUrls: ['./sidebar-v2.component.scss']
})
export class SidebarV2Component {

  isSidebarExpanded: boolean = false;

  itStrategyChildren: SidebarButtonChild[] = [
    { text: 'IT Strategic Framework', route: '/strategic_framework' },
    { text: 'IT Investments', route: '/investments' }
  ];
  gsaEnterpriseChildren: SidebarButtonChild[] = [
    { text: 'Business Capability Model', route: '/capabilities_model' },
    { text: 'Business Capability List', route: '/capabilities' },
    { text: 'Organization Chart', route: '/org_chart' },
    { text: 'Organization List', route: '/organizations' },
    { text: 'Website Service Category List', route: '/website_service_category' }
  ];
  businessSystemsChildren: SidebarButtonChild[] = [
    { text: 'Business Systems & Subsystems', route: '/systems' },
    { text: 'TIME Report', route: '/systems_TIME' },
    { text: 'Records Management', route: '/records_mgmt' },
    { text: 'GSA Websites', route: '/websites' }
  ];
  securityChildren: SidebarButtonChild[] = [
    { text: 'FISMA Systems Inventory', route: '/FISMA' },
    { text: 'FISMA System POCs', route: '/FISMA_POC' }
  ];
  technologiesChildren: SidebarButtonChild[] = [
    { text: 'IT Standards List', route: '/it_standards' },
    { text: 'IT Standards Approval Process', href: 'https://sites.google.com/a/gsa.gov/it_standards/software-approvals#h.vioogtbleinq', icon: 'fas fa-external-link-alt' }
  ];
  enterpriseArchitectureChildren: SidebarButtonChild[] = [
    { text: 'GEAR Model Diagram', route: '/gear_model' }
  ];
  additionalInfoChildren: SidebarButtonChild[] = [
    { text: 'Access Forms', route: '/forms' },
    { text: 'Glossary', route: '/glossary' },
    { text: 'Data Dictionary', route: '/data_dictionary' },
    { text: 'API Documentation', href: 'https://gsa.github.io/GEAR-Documentation/api-docs/', icon: 'fas fa-external-link-alt' }
  ];
  
  constructor() {
  }

  public toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }
}